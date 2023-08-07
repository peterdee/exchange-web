<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  reactive,
} from 'vue';
import type { Socket } from 'socket.io-client';

import type {
  ChunkData,
  ChunkRequest,
  DownloadedItem,
  ListedFile,
  UpdateDeviceName,
  UpdateFilePrivacy,
} from './types';
import connection from './connection';
import { decodeBase64ToBlob } from './utilities/base64';
import DeviceNameModalComponent from './components/DeviceNameModal.vue';
import { EVENTS, MESSAGES } from './configuration';
import FileListComponent from './components/FileList.vue';
import FileOptionsModalComponent from './components/FileOptionsModal.vue';
import FooterComponent from './components/Footer.vue';
import { getValue, setValue } from './utilities/storage';
import HeaderComponent from './components/Header.vue';
import isMobile from './utilities/is-mobile';
import SettingsModalComponent from './components/SettingsModal.vue';

interface AppState {
  connected: boolean;
  deviceName: string;
  downloads: DownloadedItem[];
  fileOptionsFileId: string;
  isMobile: boolean;
  listedFiles: ListedFile[];
  showDeviceNameModal: boolean;
  showSettingsModal: boolean;
}

const state = reactive<AppState>({
  connected: false,
  deviceName: '',
  downloads: [],
  fileOptionsFileId: '',
  isMobile: false,
  listedFiles: [],
  showDeviceNameModal: false,
  showSettingsModal: false,
});

const deleteFile = ({ fileId }: { fileId: string }): Socket => {
  state.listedFiles = state.listedFiles.filter(
    (item: ListedFile): boolean => item.id !== fileId,
  );
  return connection.io.emit(
    EVENTS.deleteFile,
    { fileId },
  );
};

const downloadFile = (
  { fileId, ownerId }: { fileId: string, ownerId: string },
): Socket => {
  return connection.io.emit(
    EVENTS.downloadFile,
    {
      fileId,
      ownerId,
    },
  );
};

const handleAddFile = (entry: ListedFile): Socket => {
  state.listedFiles.push(entry);
  return connection.io.emit(
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

const handleDeleteAllFiles = (): void => {
  state.listedFiles = [];
  state.showSettingsModal = false;
};

const handleDeviceName = (value: string): void => {
  state.deviceName = value;
  state.showDeviceNameModal = false;
  setValue<string>('deviceName', value);
  return setValue<boolean>('deviceNameSet', true);
}

const handleFilePrivacy = (fileId: string, value: boolean): Socket => {
  state.listedFiles = state.listedFiles.reduce(
    (array: ListedFile[], item: ListedFile): ListedFile[] => {
      if (item.id === fileId) {
        const updatedItem: ListedFile = {
          ...item,
          private: value,
        };
        array.push(updatedItem);
      } else {
        array.push(item);
      }
      return array;
    },
    [],
  );
  // TODO: use acknowledgements, move this handler into the modal
  return connection.io.emit(
    EVENTS.updateFilePrivacy,
    {
      fileId,
      isPrivate: value,
      ownerId: connection.io.id,
    },
  );
};

const handleUpdateDeviceName = (value: string): void => {
  state.showSettingsModal = false;
  connection.io.emit(
    EVENTS.updateDeviceName,
    { newDeviceName: value, ownerId: connection.io.id } as UpdateDeviceName,
  );
  return handleDeviceName(value);
};

const ioHandlerClientDisconnect = ({ id }: { id: string }): void => {
  state.listedFiles = state.listedFiles.filter(
    (entry: ListedFile): boolean => entry.ownerId !== id,
  );
};

const ioHandlerDeleteAllFiles = ({ ownerId = '' }: { ownerId: string }): void => {
  state.listedFiles = state.listedFiles.filter(
    (item: ListedFile): boolean => item.ownerId !== ownerId,
  );
};

const ioHandlerDeleteFile = ({ fileId }: { fileId: string }): void => {
  state.listedFiles = state.listedFiles.filter(
    (item: ListedFile): boolean => item.id !== fileId,
  );
};

const ioHandlerDownloadFile = async (
  data: { fileId: string; targetId: string },
): Promise<Socket | void> => {
  const { fileId = '', targetId = '' } = data;
  const [file] = state.listedFiles.filter(
    (item: ListedFile): boolean => item.id === fileId && item.isOwner,
  );
  if (!file) {
    return connection.io.emit(
      EVENTS.downloadFileError,
      {
        info: MESSAGES.fileNotFound,
        targetId,
      }
    );
  }
  return connection.io.emit(
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

// TODO: handle errors
const ioHandlerDownloadFileError = (data: unknown): void => {
  console.log(data);
};

const ioHandlerListFile = (data: ListedFile): void => {
  state.listedFiles.push({
    ...data,
    isOwner: false,
    passwordHash: '',
  });
};

const ioHandlerRequestFileChunk = (data: ChunkRequest): Socket => {
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
  return connection.io.emit(
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

const ioHandlerRequestListedFiles = (data: ListedFile[]): void => {
  if (Array.isArray(data) && data.length > 0) {
    data.forEach((item: ListedFile): void => {
      state.listedFiles.push({
        ...item,
        isOwner: false,
        passwordHash: '',
      });
    });
  }
};

const ioHandlerUpdateDeviceName = (data: UpdateDeviceName): void => {
  const { newDeviceName = '', ownerId = '' } = data;
  state.listedFiles.forEach((item: ListedFile): void => {
    if (item.ownerId === ownerId) {
      item.deviceName = newDeviceName;
    }
  });
};

const ioHandlerUpdateFilePrivacy = (data: UpdateFilePrivacy): void => {
  const {
    fileId,
    isPrivate,
    ownerId,
  } = data;
  state.listedFiles = state.listedFiles.reduce(
    (array: ListedFile[], item: ListedFile): ListedFile[] => {
      if (item.id === fileId && item.ownerId === ownerId) {
        const updatedItem: ListedFile = {
          ...item,
          private: isPrivate,
        };
        array.push(updatedItem);
      } else {
        array.push(item);
      }
      return array;
    },
    [],
  );
};

const ioHandlerUploadFileChunk = (data: ChunkData): Socket | void => {
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
    return connection.io.emit(
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
    return URL.revokeObjectURL(url);
  }
};

const toggleSettingsModal = (): void => {
  state.showSettingsModal = !state.showSettingsModal;
}

onBeforeUnmount((): void => {
  if (state.connected) {
    const { io } = connection;
    io.off(EVENTS.clientDisconnect, ioHandlerClientDisconnect);
    io.off(EVENTS.deleteAllFiles, ioHandlerDeleteAllFiles);
    io.off(EVENTS.deleteFile, ioHandlerDeleteFile);
    io.off(EVENTS.downloadFile, ioHandlerDownloadFile);
    io.off(EVENTS.downloadFileError, ioHandlerDownloadFileError);
    io.off(EVENTS.listFile, ioHandlerListFile);
    io.off(EVENTS.requestFileChunk, ioHandlerRequestFileChunk);
    io.off(EVENTS.requestListedFiles, ioHandlerRequestListedFiles);
    io.off(EVENTS.updateDeviceName, ioHandlerUpdateDeviceName);
    io.off(EVENTS.updateFilePrivacy, ioHandlerUpdateFilePrivacy);
    io.off(EVENTS.uploadFileChunk, ioHandlerUploadFileChunk);
    io.emit(EVENTS.close);
  }
});

onMounted((): void => {
  // set proper favicon
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    const faviconLink = document.querySelector<HTMLLinkElement>(`link[rel~='${'icon'}']`);
    if (faviconLink) {
      faviconLink.href = 'favicon-light.svg';
    }
  }

  // check if device is mobile
  state.isMobile = isMobile();

  const deviceName = getValue<string>('deviceName');
  const deviceNameSet = getValue<boolean>('deviceNameSet');
  if (!deviceName || !deviceNameSet) {
    state.deviceName = `${Math.random() * Date.now()}`.split('.').join('');
    state.showDeviceNameModal = true;
    setValue('deviceName', state.deviceName);
  } else {
    state.deviceName = deviceName;
  }

  const { io } = connection;
  io.open();
  io.on(
    EVENTS.connect,
    (): void => {
      io.emit(EVENTS.requestListedFiles);
      io.on(EVENTS.clientDisconnect, ioHandlerClientDisconnect);
      io.on(EVENTS.deleteAllFiles, ioHandlerDeleteAllFiles);
      io.on(EVENTS.deleteFile, ioHandlerDeleteFile);
      io.on(EVENTS.downloadFile, ioHandlerDownloadFile);
      io.on(EVENTS.downloadFileError, ioHandlerDownloadFileError);
      io.on(EVENTS.listFile, ioHandlerListFile);
      io.on(EVENTS.requestFileChunk, ioHandlerRequestFileChunk);
      io.on(EVENTS.requestListedFiles, ioHandlerRequestListedFiles);
      io.on(EVENTS.updateDeviceName, ioHandlerUpdateDeviceName);
      io.on(EVENTS.updateFilePrivacy, ioHandlerUpdateFilePrivacy);
      io.on(EVENTS.uploadFileChunk, ioHandlerUploadFileChunk);
      state.connected = true;
    },
  );
});
</script>

<template>
  <div class="f j-center h-100vh">
    <template v-if="!state.connected">
      Connecting...
    </template>
    <DeviceNameModalComponent
      v-if="state.showDeviceNameModal"
      @handle-device-name="handleDeviceName"
    />
    <FileOptionsModalComponent
      v-if="!!state.fileOptionsFileId"
      :listed-file="state.listedFiles.filter(
        (item: ListedFile): boolean => item.id === state.fileOptionsFileId,
      )[0]"
      @handle-file-privacy="handleFilePrivacy"
    />
    <div
      v-if="state.connected"
      class="f d-col w-100"
    >
      <SettingsModalComponent
        v-if="state.showSettingsModal"
        :device-name="state.deviceName"
        :is-mobile="state.isMobile"
        :shared-files="state.listedFiles.filter(
          (item: ListedFile): boolean => item.ownerId === connection.io.id,
        ).length"
        @close-modal="toggleSettingsModal"
        @delete-all-files="handleDeleteAllFiles"
        @update-device-name="handleUpdateDeviceName"
      />
      <HeaderComponent
        :is-mobile="state.isMobile"
        @toggle-settings-modal="toggleSettingsModal"
      />
      <FileListComponent
        :device-name="state.deviceName"
        :is-mobile="state.isMobile"
        :listed-files="state.listedFiles"
        :owner-id="connection.io.id"
        @handle-add-file="handleAddFile"
        @handle-delete-file="deleteFile"
        @handle-download-file="downloadFile"
      />
      <FooterComponent
        :backend-status="state.connected
          ? 'connected'
          : 'inaccessible'"
        :is-mobile="state.isMobile"
      />
    </div>
  </div>
</template>
