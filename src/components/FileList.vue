<script setup lang="ts">
import { reactive } from 'vue';

import { COLORS, EVENTS } from '../configuration';
import connection from '../connection';
import DeleteIconComponent from '../components/DeleteIcon.vue';
import DownloadIconComponent from '../components/DownloadIcon.vue';
import formatFileSize from '../utilities/format-file-size';
import getFilesFromDroppedItems from '../utilities/get-files-from-dropped-items';
import type { ListedFile } from '../types';
import MenuDotsIconComponent from '../components/MenuDotsIcon.vue';
import StyledButtonComponent from '../components/StyledButton.vue';
import prepareSharedFiles from '../utilities/prepare-shared-files';

interface ComponentState {
  deleteFileId: string;
  drag: boolean;
}

const emit = defineEmits([
  'handle-add-file',
  'handle-delete-file',
  'handle-download-file',
]);

const props = defineProps<{
  deviceName: string;
  isMobile: boolean;
  listedFiles: ListedFile[];
  ownerId: string;
}>();

const state = reactive<ComponentState>({
  deleteFileId: '',
  drag: false,
});

const handleFileDrop = async (event: DragEvent): Promise<null | void> => {
  state.drag = false;
  const { dataTransfer } = event;
  if (!dataTransfer) {
    return null;
  }
  const files = await getFilesFromDroppedItems(dataTransfer);
  const preparedFiles = await prepareSharedFiles(
    files,
    props.listedFiles,
    props.deviceName,
    props.ownerId,
  );
  preparedFiles.forEach((entry: ListedFile): void => {
    if (connection.io.connected) {
      connection.io.emit(
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
    }
    return emit('handle-add-file', entry);
  });
};

const handleDelete = (fileId: string): void => {
  state.deleteFileId = fileId;
  setTimeout(
    (): void => {
      emit('handle-delete-file', { fileId });
      state.deleteFileId = '';
    },
    240,
  );
};

const handleDrag = (): void => {
  state.drag = !state.drag;
};
</script>

<template>
  <div
    :class="`f d-col mh-auto file-list ${state.drag
      ? 'drag'
      : ''} ${props.listedFiles.length === 0
      ? 'j-center'
      : ''} ${props.isMobile ? 'list-mobile' : ''}`"
    @dragenter.prevent="handleDrag"
    @dragleave.prevent="handleDrag"
    @dragover.prevent
    @drop.prevent="handleFileDrop"
  >
    <div
      v-if="props.listedFiles.length === 0"
      class="t-center ns fade-in drop-files-text"
    >
      Drop files here...
    </div>
    <div
      v-if="props.listedFiles.length > 0"
      v-for="file in props.listedFiles"
      :class="`f j-space-between ai-center fade-in m-quarter ${state.deleteFileId === file.id
        ? 'fade-out'
        : ''}`"
      :key="file.id"
    >
      <span>
        {{ file.name }} (owner: {{ file.deviceName }}) (size: {{ formatFileSize(file.size) }})
      </span>
      <div class="f">
        <StyledButtonComponent
          title="Options"
          :custom-styles="{ height: '32px' }"
          :disabled="state.deleteFileId === file.id"
          :global-classes="['mh-1']"
          :with-icon="true"
        >
          <MenuDotsIconComponent :color="COLORS.muted" />
        </StyledButtonComponent>
        <StyledButtonComponent
          v-if="file.isOwner"
          title="Delete"
          :custom-styles="{ height: '32px' }"
          :disabled="state.deleteFileId === file.id"
          :with-icon="true"
          @handle-click="(): void => handleDelete(file.id)"
        >
          <DeleteIconComponent :color="COLORS.error" />
        </StyledButtonComponent>
        <StyledButtonComponent
          v-if="!file.isOwner"
          title="Download"
          :custom-styles="{ height: '32px' }"
          :with-icon="true"
          @handle-click="(): void => emit(
            'handle-download-file',
            {
              fileId: file.id,
              ownerId: file.ownerId,
            },
          )"
        >
          <DownloadIconComponent />
        </StyledButtonComponent>
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
.list-mobile {
  width: calc(100% - var(--spacer) * 2);
}
</style>
