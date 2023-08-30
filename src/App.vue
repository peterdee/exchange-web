<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  reactive,
} from 'vue';
import type { Socket } from 'socket.io-client';

import type {
  AcknowledgementMessage,
  ListedFile,
} from './types';
import DeviceNameModalComponent from './components/modals/DeviceNameModal.vue';
import DownloadErrorModalComponent from './components/modals/DownloadErrorModal.vue';
import EnterPasswordModalComponent from './components/modals/EnterPasswordModal.vue';
import { EVENTS, MESSAGES } from './configuration';
import FileListComponent from './components/FileList.vue';
import FileDetailsModalComponent from './components/modals/FileDetailsModal.vue';
import FooterComponent from './components/Footer.vue';
import { getValue, setValue } from './utilities/storage';
import HeaderComponent from './components/Header.vue';
import PasswordModalComponent from './components/modals/PasswordModal.vue';
import SettingsModalComponent from './components/modals/SettingsModal.vue';
import store, { handleDisconnect } from './store';
import StyledSpinnerComponent from './components/elements/StyledSpinner.vue';
import wakeLock from './utilities/wakelock';

interface AppState {
  deviceName: string;
  downloadErrorMessage: string;
  enterPasswordModalFileId: string;
  fileDetailsFileId: string;
  passwordModalFileId: string;
  showDeviceNameModal: boolean;
  showSettingsModal: boolean;
}

const state = reactive<AppState>({
  deviceName: '',
  downloadErrorMessage: '',
  enterPasswordModalFileId: '',
  fileDetailsFileId: '',
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

const handleDeleteAllFiles = (): void => {
  store.listedFiles = [];
  state.showSettingsModal = false;
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
): Socket => store.io.emit(
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
  store.listedFiles.forEach((item: ListedFile): void => {
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
  store.listedFiles.forEach((item: ListedFile): void => {
    if (item.id === fileId) {
      item.grant = grant;
    }
  });
};

const handleUpdateDeviceName = (value: string): void => {
  state.showSettingsModal = false;
  return handleDeviceName(value);
};

const toggleModal = (modalName: string): void => {
  if (modalName === 'settings') {
    state.showSettingsModal = !state.showSettingsModal;
  }
}

onBeforeUnmount(handleDisconnect);

onMounted((): void => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    const faviconLink = document.querySelector<HTMLLinkElement>(`link[rel~='${'icon'}']`);
    if (faviconLink) {
      faviconLink.href = 'favicon-light.svg';
    }
  }

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

  store.io.open();
});
</script>

<template>
  <div
    :class="`f j-center ${store.isMobile
      ? 'height-mobile'
      : 'h-100vh'}`"
  >
    <div
      v-if="!store.connected"
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
      @handle-device-name="handleDeviceName"
    />
    <DownloadErrorModalComponent
      v-if="state.downloadErrorMessage"
      :message="state.downloadErrorMessage"
      @close-modal="(): void => closeModal('download-error')"
    />
    <EnterPasswordModalComponent
      v-if="!!state.enterPasswordModalFileId"
      :listed-file="store.listedFiles.filter(
        (item: ListedFile): boolean => item.id === state.enterPasswordModalFileId,
      )[0]"
      @close-modal="(): void => closeModal('enter-password')"
      @handle-download-file="handleDownloadFile"
      @handle-store-grant="handleStoreGrant"
    />
    <FileDetailsModalComponent
      v-if="!!state.fileDetailsFileId"
      :listed-file="store.listedFiles.filter(
        (item: ListedFile): boolean => item.id === state.fileDetailsFileId,
      )[0]"
      @close-modal="(): void => closeModal('details')"
      @download-file="handleDownloadFile"
      @handle-show-file-password-modal="handleShowEnterPasswordModal"
      @toggle-password-modal="handleShowPasswordModal"
    />
    <PasswordModalComponent
      v-if="!!state.passwordModalFileId"
      :listed-file="store.listedFiles.filter(
        (item: ListedFile): boolean => item.id === state.passwordModalFileId,
      )[0]"
      @close-modal="(): void => closeModal('password')"
      @handle-file-password="handleFilePassword"
    />
    <div
      v-if="store.connected"
      class="f d-col w-100"
    >
      <SettingsModalComponent
        v-if="state.showSettingsModal"
        :device-name="state.deviceName"
        :shared-files="store.listedFiles.filter(
          (item: ListedFile): boolean => item.ownerId === store.io.id,
        ).length"
        @close-modal="(): void => toggleModal('settings')"
        @delete-all-files="handleDeleteAllFiles"
        @update-device-name="handleUpdateDeviceName"
      />
      <HeaderComponent
        :device-name="state.deviceName"
        :listed-files="store.listedFiles"
        :owner-id="store.io.id"
        @toggle-settings-modal="(): void => toggleModal('settings')"
      />
      <FileListComponent
        :device-name="state.deviceName"
        :listed-files="store.listedFiles"
        :owner-id="store.io.id"
        @handle-download-file="handleDownloadFile"
        @handle-open-file-details="handleFileDetails"
        @handle-show-file-password-modal="handleShowEnterPasswordModal"
      />
      <FooterComponent
        :backend-status="store.connected
          ? 'connected'
          : 'inaccessible'"
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
