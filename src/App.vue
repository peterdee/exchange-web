<script setup lang="ts">
import { io, type Socket } from 'socket.io-client';
import {
  onBeforeUnmount,
  onMounted,
  reactive,
} from 'vue';

import { EVENTS } from './configuration';
import getHash from './utilities/get-hash';

interface ListedFile {
  createdAt: number;
  file?: File;
  id: string;
  isOwner?: boolean;
  name: string;
  ownerId: string;
  private: boolean;
  size: number;
}

interface AppState {
  connected: boolean;
  connection: Socket;
  listedFiles: ListedFile[];
}

const SUPPORTS_FS_ACCESS_API = 'getAsFileSystemHandle' in DataTransferItem.prototype;
const SUPPORTS_WEBKIT_GET_AS_ENTRY = 'webkitGetAsEntry' in DataTransferItem.prototype;

const state = reactive<AppState>({
  connected: false,
  connection: {} as Socket,
  listedFiles: [],
});

const handleFileDrop = async (event: DragEvent): Promise<null | void> => {
  const { dataTransfer } = event;
  if (!dataTransfer) {
    return null;
  }
  let itemType = 'FileSystemHandle';
  const promises = [...dataTransfer.items]
    .filter((item: DataTransferItem): boolean => item.kind === 'file')
    .map((item: DataTransferItem) => {
      if (SUPPORTS_FS_ACCESS_API && (item as any).getAsFileSystemHandle) {
        return (item as any).getAsFileSystemHandle();
      }
      if (SUPPORTS_WEBKIT_GET_AS_ENTRY) {
        itemType = 'FileSystemEntry';
        return item.webkitGetAsEntry();
      }
      itemType = 'File';
      return item.getAsFile();
    });
  const results = await Promise.all(promises);
  const filtered = results.filter((item: unknown): boolean => {
    if (itemType === 'FileSystemHandle'
      && (item as FileSystemFileHandle).kind === 'file') {
      return true;
    }
    if (itemType === 'FileSystemEntry'
      && (item as FileSystemFileEntry).isFile) {
      return true;
    }
    if (itemType === 'File') {
      const { name = '', type = '' } = (item as File);
      if (!(name.includes('.') && !!type)) {
        return false;
      }
      return true;
    }
    return false;
  });
  let files: File[] = [];
  if (itemType === 'FileSystemHandle') {
    files = await Promise.all(filtered.map(
      (item: unknown): Promise<File> => (item as FileSystemFileHandle).getFile(),
    ));
  }
  if (itemType === 'FileSystemEntry') {
    const promises = filtered.map(
      (item: unknown): Promise<File> => new Promise<File>((resolve): void => {
        (item as FileSystemFileEntry).file((file: File): void => resolve(file));
      }),
    );
    files = await Promise.all(promises);
  }
  if (itemType === 'File') {
    files = (filtered as File[]);
  }
  const hashes = await Promise.all(files.map(
    (file: File): Promise<string> => getHash(file),
  ));
  files.forEach((file: File, index: number): void => {
    const alreadyListed = state.listedFiles.filter(
      (item: ListedFile): boolean => item.id === hashes[index]
        && item.file?.name === file.name && item.file?.size === file.size,
    );
    if (alreadyListed.length === 0) {
      const entry = {
        createdAt: Date.now(),
        file,
        id: hashes[index],
        isOwner: true,
        name: file.name,
        ownerId: state.connection.id,
        private: false,
        size: file.size,
      }
      state.listedFiles.push(entry);
      state.connection.emit(
        EVENTS.listFile,
        {
          createdAt: entry.createdAt,
          id: entry.id,
          name: entry.name,
          ownerId: entry.ownerId,
          private: entry.private,
          size: entry.size,
        },
      );
    }
  });
};

const handleListFile = (data: ListedFile): void => {
  state.listedFiles.push({
    ...data,
    isOwner: false,
  });
};

const handleRequestListedFiles = (data: ListedFile[]): null | void => {
  if (!data) {
    return null;
  }
  data.forEach((item: ListedFile): void => {
    state.listedFiles.push({
      ...item,
      isOwner: false,
    });
  });
};

onBeforeUnmount((): void => {
  if (state.connected) {
    const { connection } = state;
    connection.off(EVENTS.listFile, handleListFile);
    connection.off(EVENTS.requestListedFiles, handleRequestListedFiles);
    connection.emit(EVENTS.close);
  }
});

onMounted((): void => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    const faviconLink = document.querySelector<HTMLLinkElement>(`link[rel~='${'icon'}']`);
    if (faviconLink) {
      faviconLink.href = 'favicon-light.svg';
    }
  }

  const connection = io(
    'ws://localhost:9090',
    {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    },
  );

  connection.on(
    EVENTS.connect,
    (): void => {
      connection.emit(EVENTS.requestListedFiles);

      connection.on(EVENTS.listFile, handleListFile);
      connection.on(EVENTS.requestListedFiles, handleRequestListedFiles);

      state.connected = true;
      state.connection = connection;
    },
  );
});
</script>

<template>
  <div class="f ai-center j-center h-100vh">
    <template v-if="!state.connected">
      Connecting...
    </template>
    <div
      class="f d-col"
      v-if="state.connected"
    >
      <h1>
        Connection state: {{ state.connected }}
      </h1>
      <div
        class="drop-zone"
        @dragover.prevent
        @drop.prevent="handleFileDrop"
      >
        <div
          v-for="file in state.listedFiles"
          :key="file.id"
        >
          {{ file.name }} ({{ file.size }})
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drop-zone {
  background-color: var(--muted-light);
  border: calc(var(--spacer-quarter) / 4) dotted var(--text);
  height: calc(var(--spacer) * 40);
  width: calc(var(--spacer) * 40);
}
</style>
