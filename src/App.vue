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
  GenericFileData,
  ListedFile,
  UpdateDeviceName,
} from './types';
import connection from './connection';
import { decodeBase64ToBlob } from './utilities/base64';
import DeviceNameModalComponent from './components/modals/DeviceNameModal.vue';
import { EVENTS, MESSAGES } from './configuration';
import FileListComponent from './components/FileList.vue';
import FileDetailsModalComponent from './components/modals/FileDetailsModal.vue';
import FooterComponent from './components/Footer.vue';
import { getValue, setValue } from './utilities/storage';
import HeaderComponent from './components/Header.vue';
import isMobile from './utilities/is-mobile';
import PasswordModalComponent from './components/modals/PasswordModal.vue';
import SettingsModalComponent from './components/modals/SettingsModal.vue';
import StyledSpinnerComponent from './components/elements/StyledSpinner.vue';

interface AppState {
  connected: boolean;
  deviceName: string;
  downloads: DownloadedItem[];
  fileDetailsFileId: string;
  isMobile: boolean;
  listedFiles: ListedFile[];
  passwordModalFileId: string;
  showDeviceNameModal: boolean;
  showSettingsModal: boolean;
}

const state = reactive<AppState>({
  connected: false,
  deviceName: '',
  downloads: [],
  fileDetailsFileId: '',
  isMobile: false,
  listedFiles: [],
  passwordModalFileId: '',
  showDeviceNameModal: false,
  showSettingsModal: false,
});

const closeModal = (modalName: string): void => {
  if (modalName === 'details') {
    state.fileDetailsFileId = '';
  }
  if (modalName === 'password') {
    state.passwordModalFileId = '';
  }
};

const handleAddFile = (entry: ListedFile): void => {
  state.listedFiles.push(entry);
};

const handleDeleteAllFiles = (): void => {
  state.listedFiles = [];
  state.showSettingsModal = false;
};

const handleDeleteFile = ({ fileId }: { fileId: string }): Socket => {
  state.listedFiles = state.listedFiles.filter(
    (item: ListedFile): boolean => item.id !== fileId,
  );
  return connection.io.emit(
    EVENTS.deleteFile,
    { fileId },
  );
};

const handleDeviceName = (value: string): void => {
  state.deviceName = value;
  state.showDeviceNameModal = false;
  setValue<string>('deviceName', value);
  return setValue<boolean>('deviceNameSet', true);
}

const handleDownloadFile = (
  { fileId, ownerId }: { fileId: string, ownerId: string },
): Socket => connection.io.emit(
  EVENTS.downloadFile,
  {
    fileId,
    ownerId,
  },
);

const handleFileDetails = (fileId: string): void => {
  state.fileDetailsFileId = fileId;
}

const handleFilePassword = (
  {
    fileId = '',
    withPassword = false,
  }: {
    fileId: string;
    withPassword: boolean;
  },
): void => {
  state.listedFiles.forEach((item: ListedFile): void => {
    if (item.id === fileId) {
      item.withPassword = withPassword;
    }
  });
};

const handleShowPasswordModal = (fileId: string): void => {
  state.passwordModalFileId = fileId;
};

const handleUpdateDeviceName = (value: string): void => {
  state.showSettingsModal = false;
  return handleDeviceName(value);
};

const ioHandlerChangePassword = (data: GenericFileData): void => {
  const { fileId = '', ownerId = '' } = data;
  state.listedFiles.forEach((item: ListedFile): void => {
    if (item.id === fileId && item.ownerId === ownerId) {
      item.withPassword = true;
    }
  });
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

const ioHandlerDeleteFile = ({ fileId = '' }: { fileId: string }): void => {
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
  });
};

const ioHandlerRemoveFilePassword = (data: GenericFileData): void => {
  const { fileId = '', ownerId = '' } = data;
  state.listedFiles.forEach((item: ListedFile): void => {
    if (item.id === fileId && item.ownerId === ownerId) {
      item.withPassword = false;
    }
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
    io.off(EVENTS.changePassword, ioHandlerChangePassword);
    io.off(EVENTS.clientDisconnect, ioHandlerClientDisconnect);
    io.off(EVENTS.deleteAllFiles, ioHandlerDeleteAllFiles);
    io.off(EVENTS.deleteFile, ioHandlerDeleteFile);
    io.off(EVENTS.downloadFile, ioHandlerDownloadFile);
    io.off(EVENTS.downloadFileError, ioHandlerDownloadFileError);
    io.off(EVENTS.listFile, ioHandlerListFile);
    io.off(EVENTS.removePassword, ioHandlerRemoveFilePassword);
    io.off(EVENTS.requestFileChunk, ioHandlerRequestFileChunk);
    io.off(EVENTS.requestListedFiles, ioHandlerRequestListedFiles);
    io.off(EVENTS.updateDeviceName, ioHandlerUpdateDeviceName);
    io.off(EVENTS.uploadFileChunk, ioHandlerUploadFileChunk);
    io.emit(EVENTS.close);
  }
});

onMounted((): void => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    const faviconLink = document.querySelector<HTMLLinkElement>(`link[rel~='${'icon'}']`);
    if (faviconLink) {
      faviconLink.href = 'favicon-light.svg';
    }
  }

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
      io.on(EVENTS.changePassword, ioHandlerChangePassword);
      io.on(EVENTS.clientDisconnect, ioHandlerClientDisconnect);
      io.on(EVENTS.deleteAllFiles, ioHandlerDeleteAllFiles);
      io.on(EVENTS.deleteFile, ioHandlerDeleteFile);
      io.on(EVENTS.downloadFile, ioHandlerDownloadFile);
      io.on(EVENTS.downloadFileError, ioHandlerDownloadFileError);
      io.on(EVENTS.listFile, ioHandlerListFile);
      io.on(EVENTS.removePassword, ioHandlerRemoveFilePassword);
      io.on(EVENTS.requestFileChunk, ioHandlerRequestFileChunk);
      io.on(EVENTS.requestListedFiles, ioHandlerRequestListedFiles);
      io.on(EVENTS.updateDeviceName, ioHandlerUpdateDeviceName);
      io.on(EVENTS.uploadFileChunk, ioHandlerUploadFileChunk);
      state.connected = true;
    },
  );
});
</script>

<template>
  <div class="f j-center h-100vh">
    <div
      v-if="!state.connected"
      class="f ai-center"
    >
      <div class="f d-col">
        <span class="t-center input-title">
          Connecting to the server...
        </span>
        <div class="f ai-center j-center mt-1 mh-auto spinner-background">
          <StyledSpinnerComponent />
        </div>
      </div>
    </div>
    <DeviceNameModalComponent
      v-if="state.showDeviceNameModal"
      :is-mobile="state.isMobile"
      @handle-device-name="handleDeviceName"
    />
    <FileDetailsModalComponent
      v-if="!!state.fileDetailsFileId"
      :is-mobile="state.isMobile"
      :listed-file="state.listedFiles.filter(
        (item: ListedFile): boolean => item.id === state.fileDetailsFileId,
      )[0]"
      @close-modal="(): void => closeModal('details')"
      @download-file="handleDownloadFile"
      @toggle-password-modal="handleShowPasswordModal"
    />
    <PasswordModalComponent
      v-if="!!state.passwordModalFileId"
      :is-mobile="state.isMobile"
      :listed-file="state.listedFiles.filter(
        (item: ListedFile): boolean => item.id === state.passwordModalFileId,
      )[0]"
      @close-modal="(): void => closeModal('password')"
      @handle-file-password="handleFilePassword"
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
        :device-name="state.deviceName"
        :is-mobile="state.isMobile"
        :listed-files="state.listedFiles"
        :owner-id="connection.io.id"
        @handle-add-file="handleAddFile"
        @toggle-settings-modal="toggleSettingsModal"
      />
      <FileListComponent
        :device-name="state.deviceName"
        :is-mobile="state.isMobile"
        :listed-files="state.listedFiles"
        :owner-id="connection.io.id"
        @handle-add-file="handleAddFile"
        @handle-delete-file="handleDeleteFile"
        @handle-download-file="handleDownloadFile"
        @handle-open-file-details="handleFileDetails"
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

<style scoped>
.spinner-background {
  background-color: var(--accent);
  border-radius: 50%;
  height: calc(var(--spacer) * 3);
  width: calc(var(--spacer) * 3);
}
</style>
