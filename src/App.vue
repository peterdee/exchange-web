<script setup lang="ts">
import { io, type Socket } from 'socket.io-client';
import {
  onBeforeUnmount,
  onMounted,
  reactive,
} from 'vue';

import type {
  ChunkData,
  ChunkRequest,
  DownloadedItem,
  ListedFile,
} from './types';
import {
  EVENTS,
  MESSAGES,
  WS_URL,
} from './configuration';
import { decodeBase64ToBlob } from './utilities/base64';
import DeviceNameModalComponent from './components/DeviceNameModal.vue';
import FileListComponent from './components/FileList.vue';
import { getValue, setValue } from './utilities/storage';

interface AppState {
  connected: boolean;
  connection: Socket;
  deviceName: string;
  downloads: DownloadedItem[];
  listedFiles: ListedFile[];
  setShowDeviceNameModal: boolean;
}

const state = reactive<AppState>({
  connected: false,
  connection: {} as Socket,
  deviceName: '',
  downloads: [],
  listedFiles: [],
  setShowDeviceNameModal: false,
});

const downloadFile = (
  { fileId, ownerId }: { fileId: string, ownerId: string },
): Socket => {
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

const handleAddFile = (entry: ListedFile): Socket => {
  state.listedFiles.push(entry);
  return state.connection.emit(
    EVENTS.listFile,
    {
      createdAt: entry.createdAt,
      deviceName: entry.deviceName,
      id: entry.id,
      name: entry.name,
      ownerId: entry.ownerId,
      private: entry.private,
      size: entry.size,
    },
  );
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
    const blob = decodeBase64ToBlob(base64String, completeFile.type);
    const url = URL.createObjectURL(blob);
    const downloadLink = window.document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = completeFile.fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
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
    WS_URL,
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
      <div class="ml-2 mb-half ns title">
        EXCHANGE
      </div>
      <FileListComponent
        :device-name="state.deviceName"
        :listed-files="state.listedFiles"
        :owner-id="state.connection.id"
        @handle-add-file="handleAddFile"
        @handle-download-file="downloadFile"
      />
    </div>
  </div>
</template>

<style scoped>
.title {
  color: var(--accent);
  font-size: calc(var(--spacer) * 1.25);
  font-weight: 300;
}
</style>
