<script setup lang="ts">
import { reactive } from 'vue';

import CheckFilledIconComponent from './icons/CheckFilledIcon.vue';
import CheckIconComponent from './icons/CheckIcon.vue';
import { convertArrayBufferChunksToBlob } from '../utilities/binary';
import connection from '../connection';
import CrossIconComponent from './icons/CrossIcon.vue';
import DeleteIconComponent from './icons/DeleteIcon.vue';
import DownloadIconComponent from './icons/DownloadIcon.vue';
import { EVENTS, SPACER } from '../configuration';
import getFilesFromDroppedItems from '../utilities/get-files-from-dropped-items';
import type { ListedFile } from '../types';
import LockIconComponent from './icons/LockIcon.vue';
import MenuDotsIconComponent from './icons/MenuDotsIcon.vue';
import PrepareFilesModalComponent from './modals/PrepareFilesModal.vue';
import prepareSharedFiles from '../utilities/prepare-shared-files';
import saveFileOnDisk from '../utilities/save-file-on-disk';
import SaveIconComponent from './icons/SaveIcon.vue';
import store from '../store';
import StyledButtonComponent from './elements/StyledButton.vue';
import StyledCircularProgressBarComponent from './elements/StyledCircularProgressBar.vue';

interface ComponentState {
  deleteFileId: string;
  drag: boolean;
  preparedFiles: ListedFile[];
  showPrepareFilesModal: boolean;
}

const emit = defineEmits([
  'handle-abort-downloading',
  'handle-download-file',
  'handle-open-file-details',
  'handle-show-file-password-modal',
]);

const props = defineProps<{ ownerId: string }>();

const state = reactive<ComponentState>({
  deleteFileId: '',
  drag: false,
  preparedFiles: [],
  showPrepareFilesModal: false,
});

const handleDelete = (fileId: string): void => {
  state.deleteFileId = fileId;
  if (connection.io.connected) {
    connection.io.emit(EVENTS.deleteFile, { fileId });
  }
  setTimeout(
    (): void => {
      store.listedFiles = store.listedFiles.filter(
        (item: ListedFile): boolean => item.id !== fileId,
      );
      state.deleteFileId = '';
    },
    240,
  );
};

const handleDownload = (file: ListedFile) => {
  if (!file.withPassword) {
    store.listedFiles.forEach((item) => {
      if (item.id === file.id) {
        item.isRequestedDownload = true;
      }
    });
    return emit(
      'handle-download-file',
      {
        fileId: file.id,
        ownerId: file.ownerId,
      },
    );
  }
  if (file.withPassword && file.grant) {
    store.listedFiles.forEach((item) => {
      if (item.id === file.id) {
        item.isRequestedDownload = true;
      }
    });
    return emit(
      'handle-download-file',
      {
        fileId: file.id,
        grant: file.grant,
        ownerId: file.ownerId,
      },
    );
  }
  return emit(
    'handle-show-file-password-modal',
    file.id,
  );
};

const handleDrag = (): void => {
  state.drag = !state.drag;
};

const handleFileDrop = async (event: DragEvent): Promise<null | void> => {
  state.drag = false;
  state.showPrepareFilesModal = true;
  const { dataTransfer } = event;
  if (!dataTransfer) {
    return null;
  }
  const files = await getFilesFromDroppedItems(dataTransfer);
  state.preparedFiles = await prepareSharedFiles(
    files,
    store.listedFiles,
    store.deviceName,
    props.ownerId,
    store.serverConfiguration.chunkSizeBytes,
    store.serverConfiguration.maxFileSizeBytes,
  );
  if (state.preparedFiles.length === 0) {
    state.showPrepareFilesModal = false;
  }
};

const handleSaveOnDisk = (fileId: string) => {
  const [downloadedFile] = store.downloads.filter((item) => item.fileId === fileId);
  store.listedFiles.forEach((item) => {
    if (item.id === fileId) {
      item.downloadPercent = 0;
    }
  });
  if (!downloadedFile) {
    return null;
  }
  if (!downloadedFile.downloadCompleted) {
    store.downloads = store.downloads.filter((item) => item.fileId !== fileId);
    return null;
  }

  saveFileOnDisk(
    convertArrayBufferChunksToBlob(downloadedFile.chunks, downloadedFile.type),
    downloadedFile.fileName,
  );
  store.downloads = store.downloads.filter((item) => item.fileId !== fileId);
  store.listedFiles.forEach((item) => {
    if (item.id === fileId) {
      item.isSavedOnDisk = true;
    }
  });
  return null;
};

const handleShareFiles = (files: ListedFile[], password: string): void => {
  files.forEach((file: ListedFile): void => {
    if (connection.io.connected) {
      connection.io.emit(
        EVENTS.listFile,
        {
          createdAt: file.createdAt,
          deviceName: file.deviceName,
          fileName: file.fileName,
          fileSize: file.fileSize,
          id: file.id,
          ownerId: file.ownerId,
          password,
          withPassword: !!password,
        },
      );
    }
    store.listedFiles.push({
      ...file,
      withPassword: !!password,
    });
  });
};

const togglePrepareFilesModal = (): void => {
  state.showPrepareFilesModal = false;
};
</script>

<template>
  <PrepareFilesModalComponent
    v-if="state.showPrepareFilesModal"
    :is-mobile="store.isMobile"
    :prepared-files="state.preparedFiles"
    @close-modal="togglePrepareFilesModal"
    @handle-share-files="handleShareFiles"
  />
  <div
    :class="`f d-col mh-auto file-list ${state.drag
      ? 'drag'
      : ''} ${store.listedFiles.length === 0
      ? 'j-center'
      : ''} ${store.isMobile ? 'list-mobile' : ''}`"
    @dragenter.prevent="handleDrag"
    @dragleave.prevent="handleDrag"
    @dragover.prevent
    @drop.prevent="handleFileDrop"
  >
    <div
      v-if="store.listedFiles.length === 0"
      class="t-center ns fade-in drop-files-text"
    >
      {{ store.isMobile ? 'No files shared' : 'Drop files here...' }}
    </div>
    <div
      v-if="store.listedFiles.length > 0"
      v-for="file in store.listedFiles"
      :class="`f j-space-between ai-center fade-in ${state.deleteFileId === file.id
        ? 'fade-out'
        : ''} ${store.isMobile
        ? 'm-quarter'
        : 'm-half'}`"
      :key="file.id"
    >
      <div class="f ai-center name-container">
        <div class="ns input-title file-name">
          {{ file.fileName }}
        </div>
      </div>
      <div class="f ai-center">
        <StyledButtonComponent
          title="Options"
          :custom-styles="{ height: `${SPACER * 2}px` }"
          :disabled="state.deleteFileId === file.id"
          :global-classes="store.isMobile ? ['mh-half'] : ['mh-1']"
          :with-icon="true"
          @handle-click="() => emit('handle-open-file-details', file.id)"
        >
          <MenuDotsIconComponent :color="store.palette.muted" />
        </StyledButtonComponent>
        <StyledButtonComponent
          v-if="file.isOwner"
          title="Delete file"
          :custom-styles="{ height: `${SPACER * 2}px` }"
          :disabled="state.deleteFileId === file.id"
          :with-icon="true"
          @handle-click="() => handleDelete(file.id)"
        >
          <DeleteIconComponent :color="store.palette.error" />
        </StyledButtonComponent>
        <template v-if="!file.isOwner">
          <StyledButtonComponent
            v-if="!file.isDownloading && file.downloadPercent === 0"
            title="Download file"
            :custom-styles="{ height: `${SPACER * 2}px` }"
            :disabled="file.isRequestedDownload"
            :with-icon="true"
            @handle-click="() => handleDownload(file)"
          >
            <DownloadIconComponent
              :color="file.isRequestedDownload
                ? store.palette.muted
                : store.palette.accent"
            />
          </StyledButtonComponent>
          <StyledButtonComponent
            v-if="!file.isDownloading && file.downloadPercent === 100 && !file.isSavedOnDisk"
            title="Save file on disk"
            :custom-styles="{ height: `${SPACER * 2}px` }"
            :with-icon="true"
            @handle-click="() => handleSaveOnDisk(file.id)"
          >
            <SaveIconComponent :color="store.palette.accent" />
          </StyledButtonComponent>
          <StyledButtonComponent
            v-if="file.isDownloading"
            title="Abort downloading"
            :custom-styles="{ height: `${SPACER * 2}px` }"
            :with-icon="true"
            @handle-click="() => emit('handle-abort-downloading', file.id)"
          >
            <CrossIconComponent :color="store.palette.error" />
          </StyledButtonComponent>
        </template>
        <div
          v-if="!file.downloadCompleted && !file.isDownloading"
          :class="`f ai-center j-center icon ml-${store.isMobile ? 'quarter' : 'half'}`"
          :title="file.withPassword
            ? 'Protected with password'
            : 'No password protection'"
        >
          <LockIconComponent
            :color="!file.withPassword
              ? store.palette.mutedLight
              : store.palette.accent"
          />
        </div>
        <div
          v-if="!file.downloadCompleted && file.isDownloading"
          :class="`f ai-center j-center icon ml-${store.isMobile ? 'quarter' : 'half'}`"
          :title="`Downloading file (${file.downloadPercent}%)`"
        >
          <StyledCircularProgressBarComponent :percent="file.downloadPercent" />
        </div>
        <div
          v-if="file.downloadCompleted && !file.isDownloading && !file.isSavedOnDisk"
          :class="`f ai-center j-center icon ml-${store.isMobile ? 'quarter' : 'half'}`"
          title="Download completed"
        >
          <CheckIconComponent :color="store.palette.accent" />
        </div>
        <div
          v-if="file.downloadCompleted && !file.isDownloading && file.isSavedOnDisk"
          :class="`f ai-center j-center icon ml-${store.isMobile ? 'quarter' : 'half'}`"
          title="File saved on disk"
        >
          <CheckFilledIconComponent :color="store.palette.accent" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drag {
  box-shadow: 0 0 calc(var(--spacer) * 2) 0 var(--accent-light);
  transition: box-shadow var(--transition) ease-in;
}
.drop-files-text {
  color: var(--accent);
  font-size: calc(var(--spacer) * 1.25);
  font-weight: 300;
}
.file-list {
  border: calc(var(--spacer-quarter) / 2) dotted var(--accent);
  border-radius: var(--spacer-quarter);
  height: calc(100vh - var(--spacer) * 6);
  overflow-y: scroll;
  width: calc(100% - var(--spacer) * 4);
  transition: box-shadow var(--transition) ease-out;
}
.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.icon {
  height: calc(var(--spacer) * 2);
  width: calc(var(--spacer) * 2);
}
.list-mobile {
  width: calc(100% - var(--spacer) * 2);
}
.name-container {
  overflow: hidden;
}
</style>
