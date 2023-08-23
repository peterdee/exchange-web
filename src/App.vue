<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  reactive,
} from 'vue';
import type { Socket } from 'socket.io-client';

import type {
  AcknowledgementMessage,
  ChunkData,
  ChunkRequest,
  DownloadedItem,
  GenericFileData,
  ListedFile,
  UpdateDeviceName,
} from './types';
import connection from './connection';
import { convertArrayBufferChunksToBlob } from './utilities/binary';
import DeviceNameModalComponent from './components/modals/DeviceNameModal.vue';
import DownloadErrorModalComponent from './components/modals/DownloadErrorModal.vue';
import EnterPasswordModalComponent from './components/modals/EnterPasswordModal.vue';
import { EVENTS, MESSAGES } from './configuration';
import FileListComponent from './components/FileList.vue';
import FileDetailsModalComponent from './components/modals/FileDetailsModal.vue';
import FooterComponent from './components/Footer.vue';
import { getValue, setValue } from './utilities/storage';
import HeaderComponent from './components/Header.vue';
import isMobile from './utilities/is-mobile';
import PasswordModalComponent from './components/modals/PasswordModal.vue';
import saveFileOnDisk from './utilities/save-file-on-disk';
import SettingsModalComponent from './components/modals/SettingsModal.vue';
import StyledSpinnerComponent from './components/elements/StyledSpinner.vue';
import wakeLock from './utilities/wakelock';

interface AppState {
  connected: boolean;
  deviceName: string;
  downloadErrorMessage: string;
  downloads: DownloadedItem[];
  enterPasswordModalFileId: string;
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
  downloadErrorMessage: '',
  downloads: [],
  enterPasswordModalFileId: '',
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
  if (modalName === 'download-error') {
    state.downloadErrorMessage = '';
  }
  if (modalName === 'enter-password') {
    state.enterPasswordModalFileId = '';
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
  {
    fileId = '',
    grant = '',
    ownerId = '',
  }: {
    fileId: string;
    grant?: string;
    ownerId: string;
  },
): Socket => connection.io.emit(
  EVENTS.downloadFile,
  {
    fileId,
    grant,
    ownerId,
  },
  (response: AcknowledgementMessage): null | void => {
    const { info, status } = response;
    if (status === 400) {
      if (info === MESSAGES.fileNotFound) {
        state.downloadErrorMessage = 'File no longer available!';
      }
      if (info === MESSAGES.fileOwnerDisconnected) {
        state.downloadErrorMessage = 'File owner disconnected!';
      }
      if (info === MESSAGES.missingRequiredData) {
        state.downloadErrorMessage = 'Missing required data!';
      }
      return null;
    }
    if (response.status === 401) {
      return handleShowEnterPasswordModal(fileId);
    }
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

const handleShowEnterPasswordModal = (fileId: string): void => {
  state.enterPasswordModalFileId = fileId;
};

const handleShowPasswordModal = (fileId: string): void => {
  state.passwordModalFileId = fileId;
};

const handleStoreGrant = (
  { fileId = '', grant = '' }: { fileId: string, grant: string },
): void => {
  state.listedFiles.forEach((item: ListedFile): void => {
    if (item.id === fileId) {
      item.grant = grant;
    }
  });
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

const ioHandlerDownloadFile = (
  data: { fileId: string; targetId: string },
): null | Socket => {
  const { fileId = '', targetId = '' } = data;
  const [file] = state.listedFiles.filter(
    (item: ListedFile): boolean => item.id === fileId && item.isOwner,
  );
  if (!file) {
    return null;
  }
  return connection.io.emit(
    EVENTS.uploadFileChunk,
    {
      chunk: file.chunks[0],
      currentChunk: 1,
      fileId,
      fileName: file.fileName,
      fileSize: file.fileSize,
      ownerId: file.ownerId,
      targetId,
      totalChunks: file.chunks.length,
      type: file.fileType,
    },
  );
};

const ioHandlerListFile = (data: ListedFile): void => {
  state.listedFiles.push({
    ...data,
    downloadCompleted: false,
    downloadPercent: 0,
    grant: '',
    isDownloading: false,
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

const ioHandlerRequestFileChunk = (data: ChunkRequest): null | Socket => {
  const {
    chunkIndex,
    fileId,
    targetId,
  } = data;
  const [file = null] = state.listedFiles.filter(
    (item: ListedFile): boolean => item.id === fileId,
  );
  if (!file) {
    return null;
  }
  return connection.io.emit(
    EVENTS.uploadFileChunk,
    {
      chunk: file.chunks[chunkIndex - 1],
      currentChunk: chunkIndex,
      fileId,
      fileName: file.fileName,
      fileSize: file.fileSize,
      ownerId: file.ownerId,
      targetId,
      totalChunks: file.chunks.length,
      type: file.fileType,
    },
  );
};

const ioHandlerRequestListedFiles = (data: ListedFile[]): void => {
  if (Array.isArray(data) && data.length > 0) {
    data.forEach((item: ListedFile): void => {
      state.listedFiles.push({
        ...item,
        downloadCompleted: false,
        downloadPercent: 0,
        grant: '',
        isDownloading: false,
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
  if (currentChunk === 1 && totalChunks === 1) {
    state.listedFiles.forEach((item: ListedFile): void => {
      if (item.id === fileId) {
        item.downloadCompleted = true;
        item.downloadPercent = 100
        item.isDownloading = false;
      }
    });
    return saveFileOnDisk(
      convertArrayBufferChunksToBlob([chunk], type),
      fileName,
    );
  }
  if (currentChunk === 1 && totalChunks > 1) {
    state.listedFiles.forEach((item: ListedFile): void => {
      if (item.id === fileId) {
        item.downloadCompleted = false;
        item.downloadPercent = Math.round(currentChunk / (totalChunks / 100));
        item.isDownloading = true;
      }
    });
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
    return connection.io.emit(
      EVENTS.requestFileChunk,
      {
        chunkIndex: currentChunk + 1,
        fileId,
        ownerId,
        targetId,
      },
    );
  }
  if (currentChunk > 1 && currentChunk < totalChunks) {
    state.downloads.forEach((item: DownloadedItem): void => {
      if (item.fileId === fileId) {
        item.chunks.push(chunk);
      }
    });
    state.listedFiles.forEach((item: ListedFile): void => {
      if (item.id === fileId) {
        item.downloadPercent = Math.round(currentChunk / (totalChunks / 100));
      }
    });
    return connection.io.emit(
      EVENTS.requestFileChunk,
      {
        chunkIndex: currentChunk + 1,
        fileId,
        ownerId,
        targetId,
      },
    );
  }
  if (currentChunk === totalChunks) {
    const [downloadedFile] = state.downloads.filter(
      (item: DownloadedItem): boolean => item.fileId === fileId,
    );
    state.listedFiles.forEach((item: ListedFile): void => {
      if (item.id === fileId) {
        item.downloadCompleted = true;
        item.downloadPercent = 100;
        item.isDownloading = false;
      }
    });
    downloadedFile.chunks.push(chunk);
    saveFileOnDisk(
      convertArrayBufferChunksToBlob(downloadedFile.chunks, downloadedFile.type),
      downloadedFile.fileName,
    );
    state.downloads = state.downloads.filter(
      (item: DownloadedItem): boolean => item.fileId !== fileId,
    );
  }
};

const toggleModal = (modalName: string): void => {
  if (modalName === 'settings') {
    state.showSettingsModal = !state.showSettingsModal;
  }
}

onBeforeUnmount((): void => {
  if (state.connected) {
    const { io } = connection;
    io.off(EVENTS.changePassword, ioHandlerChangePassword);
    io.off(EVENTS.clientDisconnect, ioHandlerClientDisconnect);
    io.off(EVENTS.deleteAllFiles, ioHandlerDeleteAllFiles);
    io.off(EVENTS.deleteFile, ioHandlerDeleteFile);
    io.off(EVENTS.downloadFile, ioHandlerDownloadFile);
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
  wakeLock();

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
  <div
    :class="`f j-center ${state.isMobile
      ? 'height-mobile'
      : 'h-100vh'}`"
  >
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
    <DownloadErrorModalComponent
      v-if="state.downloadErrorMessage"
      :is-mobile="state.isMobile"
      :message="state.downloadErrorMessage"
      @close-modal="(): void => closeModal('download-error')"
    />
    <EnterPasswordModalComponent
      v-if="!!state.enterPasswordModalFileId"
      :is-mobile="state.isMobile"
      :listed-file="state.listedFiles.filter(
        (item: ListedFile): boolean => item.id === state.enterPasswordModalFileId,
      )[0]"
      @close-modal="(): void => closeModal('enter-password')"
      @handle-download-file="handleDownloadFile"
      @handle-store-grant="handleStoreGrant"
    />
    <FileDetailsModalComponent
      v-if="!!state.fileDetailsFileId"
      :is-mobile="state.isMobile"
      :listed-file="state.listedFiles.filter(
        (item: ListedFile): boolean => item.id === state.fileDetailsFileId,
      )[0]"
      @close-modal="(): void => closeModal('details')"
      @download-file="handleDownloadFile"
      @handle-show-file-password-modal="handleShowEnterPasswordModal"
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
        @close-modal="(): void => toggleModal('settings')"
        @delete-all-files="handleDeleteAllFiles"
        @update-device-name="handleUpdateDeviceName"
      />
      <HeaderComponent
        :device-name="state.deviceName"
        :is-mobile="state.isMobile"
        :listed-files="state.listedFiles"
        :owner-id="connection.io.id"
        @handle-add-file="handleAddFile"
        @toggle-settings-modal="(): void => toggleModal('settings')"
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
        @handle-show-file-password-modal="handleShowEnterPasswordModal"
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
.height-mobile {
  height: fill-available;
  height: -webkit-fill-available;
}
.spinner-background {
  background-color: var(--accent);
  border-radius: 50%;
  height: calc(var(--spacer) * 3);
  width: calc(var(--spacer) * 3);
}
</style>
