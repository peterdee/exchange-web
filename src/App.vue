<script setup lang="ts">
import { io, type Socket } from 'socket.io-client';
import {
  onBeforeUnmount,
  onMounted,
  reactive,
} from 'vue';

import {
  decodeStringToBlob,
  encodeArrayBufferToString,
} from './utilities/base64';
import DeviceNameModalComponent from './components/DeviceNameModal.vue';
import { EVENTS, MESSAGES } from './configuration';
import getHash from './utilities/get-hash';
import { getValue, setValue } from './utilities/storage';
import type { ListedFile } from './types';

interface ChunkData {
  chunk: string;
  currentChunk: number;
  fileId: string;
  fileName: string;
  fileSize: string;
  ownerId: string;
  targetId: string;
  totalChunks: number;
  type: string;
}

type ChunkRequest = Pick<ChunkData, 'fileId' | 'ownerId' | 'targetId'> & {
  chunkIndex: number;
}

interface DownloadedItem {
  chunks: string[];
  downloadCompleted: boolean;
  fileId: string;
  fileName: string;
  fileSize: string;
  ownerId: string;
  totalChunks: number;
  type: string;
}

interface AppState {
  connected: boolean;
  connection: Socket;
  deviceName: string;
  downloads: DownloadedItem[];
  listedFiles: ListedFile[];
  setShowDeviceNameModal: boolean;
}

const CHUNK_LENGTH = 1024 * 128;
const SUPPORTS_FS_ACCESS_API = 'getAsFileSystemHandle' in DataTransferItem.prototype;
const SUPPORTS_WEBKIT_GET_AS_ENTRY = 'webkitGetAsEntry' in DataTransferItem.prototype;

const state = reactive<AppState>({
  connected: false,
  connection: {} as Socket,
  deviceName: '',
  downloads: [],
  listedFiles: [],
  setShowDeviceNameModal: false,
});

const downloadFile = (fileId: string, ownerId: string): Socket => {
  return state.connection.emit(
    EVENTS.downloadFile,
    {
      fileId,
      ownerId,
    },
  );
};

const handleDeviceName = (value: string): void => {
  state.deviceName = value;
  setValue<string>('deviceName', value);
  return setValue<boolean>('deviceNameSet', true);
}

const handleDownloadFile = async (
  data: { fileId: string, targetId: string },
): Promise<Socket | void> => {
  const { fileId = '', targetId = '' } = data;
  const [file] = state.listedFiles.filter(
    (item: ListedFile): boolean => item.id === fileId && !!item.isOwner,
  );
  if (!file) {
    return state.connection.emit(
      EVENTS.downloadFileError,
      {
        info: MESSAGES.fileNotFound,
        targetId,
      }
    );
  }
  return state.connection.emit(
    EVENTS.uploadFileChunk,
    {
      chunk: file.chunks[0],
      currentChunk: 1,
      fileId,
      fileName: file.name,
      fileSize: file.size,
      ownerId: file.ownerId,
      targetId,
      totalChunks: file.chunks.length,
      type: file.file?.type,
    },
  );
};

const handleDownloadFileError = (data: unknown): void => {
  console.log(data);
};

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
  const encoded = await Promise.all(files.map(encodeArrayBufferToString));
  files.forEach((file: File, index: number): void => {
    const alreadyListed = state.listedFiles.filter(
      (item: ListedFile): boolean => item.id === hashes[index]
        && item.file?.name === file.name && item.file?.size === file.size,
    );
    if (alreadyListed.length === 0) {
      const entry: ListedFile = {
        chunks: [],
        createdAt: Date.now(),
        file,
        id: hashes[index],
        isOwner: true,
        name: file.name,
        ownerId: state.connection.id,
        private: false,
        size: file.size,
      }
      let chunk = '';
      for (let i = 0; i < encoded.length; i += 1) {
        chunk += encoded[i];
        if (chunk.length === CHUNK_LENGTH) {
          entry.chunks.push(chunk);
          chunk = '';
        }
      }
      if (chunk) {
        entry.chunks.push(chunk);
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

const handleRequestFileChunk = (data: ChunkRequest): Socket | void => {
  console.log('request chunk', data);
  const {
    chunkIndex,
    fileId,
    targetId,
  } = data;

  // TODO: handle errors & edge cases
  const [file] = state.listedFiles.filter(
    (item: ListedFile): boolean => item.id === fileId,
  );
  const { chunks = [] } = file;
  return state.connection.emit(
    EVENTS.uploadFileChunk,
    {
      chunk: chunks[chunkIndex],
      currentChunk: chunkIndex,
      fileId,
      fileName: file.name,
      fileSize: file.size,
      ownerId: file.ownerId,
      targetId,
      totalChunks: chunks.length,
      type: file.file?.type,
    },
  );
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

const handleUploadFileChunk = (data: ChunkData): Socket | void => {
  console.log(data);
  const {
    chunk,
    currentChunk,
    fileId,
    fileName,
    fileSize,
    ownerId,
    targetId,
    totalChunks,
    type,
  } = data;
  const [downloadedFileEntry = null] = state.downloads.filter(
    (item: DownloadedItem): boolean => item.fileId === fileId,
  );
  if (!downloadedFileEntry) {
    const newEntry: DownloadedItem = {
      chunks: [chunk],
      downloadCompleted: currentChunk === totalChunks,
      fileId,
      fileName,
      fileSize,
      ownerId,
      totalChunks,
      type,
    };
    state.downloads.push(newEntry);
  } else {
    downloadedFileEntry.chunks.push(chunk);
    downloadedFileEntry.downloadCompleted = currentChunk === totalChunks;
    state.downloads = state.downloads.reduce(
      (array: DownloadedItem[], item: DownloadedItem): DownloadedItem[] => {
        if (item.fileId === downloadedFileEntry.fileId) {
          array.push(downloadedFileEntry);
        }
        array.push(item);
        return array;
      },
      [],
    );
  }
  if (currentChunk < totalChunks) {
    return state.connection.emit(
      EVENTS.requestFileChunk,
      {
        chunkIndex: currentChunk + 1,
        fileId,
        ownerId,
        targetId,
      },
    );
  } else {
    let completeFile: DownloadedItem;
    if (downloadedFileEntry) {
      completeFile = downloadedFileEntry;
    } else {
      [completeFile] = state.downloads.filter(
        (item: DownloadedItem): boolean => item.fileId === fileId,
      );
    }
    const base64String = completeFile.chunks.reduce(
      (string: string, chunk: string): string => `${string}${chunk}`,
      '',
    );
    console.log('download completed');
    const blob = decodeStringToBlob(base64String, completeFile.type);
    const url = URL.createObjectURL(blob);
    const downloadLink = window.document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = completeFile.fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }
};

onBeforeUnmount((): void => {
  if (state.connected) {
    const { connection } = state;
    connection.off(EVENTS.downloadFile, handleDownloadFile);
    connection.off(EVENTS.downloadFileError, handleDownloadFileError);
    connection.off(EVENTS.listFile, handleListFile);
    connection.off(EVENTS.requestFileChunk, handleRequestFileChunk);
    connection.off(EVENTS.requestListedFiles, handleRequestListedFiles);
    connection.off(EVENTS.uploadFileChunk, handleUploadFileChunk);
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

  const deviceName = getValue<string>('deviceName');
  const deviceNameSet = getValue<boolean>('deviceNameSet');
  if (!deviceName || !deviceNameSet) {
    state.deviceName = `${Math.random() * Date.now()}`.split('.').join('');
    state.setShowDeviceNameModal = true;
    setValue('deviceName', state.deviceName);
  } else {
    state.deviceName = deviceName;
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

      connection.on(EVENTS.downloadFile, handleDownloadFile);
      connection.on(EVENTS.downloadFileError, handleDownloadFileError);
      connection.on(EVENTS.listFile, handleListFile);
      connection.on(EVENTS.requestFileChunk, handleRequestFileChunk);
      connection.on(EVENTS.requestListedFiles, handleRequestListedFiles);
      connection.on(EVENTS.uploadFileChunk, handleUploadFileChunk);

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
    <DeviceNameModalComponent
      v-if="state.setShowDeviceNameModal"
      @handle-device-name="handleDeviceName"
    />
    <div
      class="f d-col w-100"
      v-if="state.connected"
    >
      <h3 class="mh-auto">
        Connected: {{ state.connected }}
      </h3>
      <div
        class="mh-auto drop-zone"
        @dragover.prevent
        @drop.prevent="handleFileDrop"
      >
        <div
          class="f j-space-between m-quarter"
          v-for="file in state.listedFiles"
          :key="file.id"
        >
          <span>
            {{ file.name }} ({{ file.size }})
          </span>
          <button
            v-if="!file.isOwner"
            class="button"
            @click="(): Socket => downloadFile(file.id, file.ownerId)"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drop-zone {
  border: calc(var(--spacer-quarter) / 4) dotted var(--text);
  height: calc(var(--spacer) * 40);
  width: calc(100% - var(--spacer) * 4);
}
</style>
