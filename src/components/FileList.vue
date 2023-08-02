<script setup lang="ts">
import { reactive } from 'vue';

import {
  CHUNK_SIZE,
  COLORS,
  SUPPORTS_FS_ACCESS_API,
  SUPPORTS_WEBKIT_GET_AS_ENTRY,
} from '../configuration';
import DownloadIconComponent from '../components/DownloadIcon.vue';
import DeleteIconComponent from '../components/DeleteIcon.vue';
import { encodeFileToBase64 } from '../utilities/base64';
import formatFileSize from '../utilities/format-file-size';
import getHash from '../utilities/get-hash';
import type { ListedFile } from '../types';
import MenuDotsIconComponent from '../components/MenuDotsIcon.vue';
import StyledButtonComponent from '../components/StyledButton.vue';

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
        (item as FileSystemFileEntry).file(resolve);
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
  const encoded = await Promise.all(files.map(encodeFileToBase64));
  files.forEach((file: File, index: number): void => {
    const alreadyListed = props.listedFiles.filter(
      (item: ListedFile): boolean => item.id === hashes[index]
        && item.file?.name === file.name && item.file?.size === file.size,
    );
    if (alreadyListed.length === 0) {
      const entry: ListedFile = {
        chunks: [],
        createdAt: Date.now(),
        deviceName: props.deviceName,
        file,
        id: hashes[index],
        isOwner: true,
        name: file.name,
        ownerId: props.ownerId,
        private: false,
        size: file.size,
      };
      let chunk = '';
      for (let i = 0; i < encoded.length; i += 1) {
        chunk += encoded[i];
        if (chunk.length === CHUNK_SIZE) {
          entry.chunks.push(chunk);
          chunk = '';
        }
      }
      if (chunk) {
        entry.chunks.push(chunk);
      }
      return emit('handle-add-file', entry);
    }
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
    :class="`f d-col mh-auto file-list ${state.drag ? 'drag' : ''}`"
    @dragenter.prevent="handleDrag"
    @dragleave.prevent="handleDrag"
    @dragover.prevent
    @drop.prevent="handleFileDrop"
  >
    <div
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
          :global-classes="['mr-1']"
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
.file-list {
  border: calc(var(--spacer-quarter) / 2) dotted var(--accent);
  border-radius: var(--spacer-quarter);
  height: calc(100vh - var(--spacer) * 6);
  overflow-y: scroll;
  width: calc(100% - var(--spacer) * 4);
  transition: box-shadow var(--transition) ease-out;
}
.drag {
  box-shadow: 0 0 calc(var(--spacer) * 2) 0 var(--accent-light);
  transition: box-shadow var(--transition) ease-in;
}
</style>
