<script setup lang="ts">
import { reactive } from 'vue';

import { COLORS, EVENTS, SPACER } from '../configuration';
import connection from '../connection';
import type { ListedFile } from '../types';
import LogoIconComponent from './icons/LogoIcon.vue';
import PrepareFilesModalComponent from './modals/PrepareFilesModal.vue';
import prepareSharedFiles from '../utilities/prepare-shared-files';
import SettingsIconComponent from './icons/SettingsIcon.vue';
import StyledButtonComponent from './elements/StyledButton.vue';
import UplaodIconComponent from './icons/UploadIcon.vue';

interface ComponentState {
  preparedFiles: ListedFile[];
  showPrepareFilesModal: boolean;
}

const emit = defineEmits([
  'handle-add-file',
  'toggle-settings-modal',
]);

const props = defineProps<{
  deviceName: string;
  isMobile: boolean;
  listedFiles: ListedFile[];
  ownerId: string;
}>();

const state = reactive<ComponentState>({
  preparedFiles: [],
  showPrepareFilesModal: false,
});

const handleUploadButton = (): void => {
  state.showPrepareFilesModal = true;
  const element = document.createElement('input');
  element.multiple = true;
  element.setAttribute('style', 'display: none');
  element.type = 'file';
  element.oninput = async (event: Event): Promise<void> => {
    const target = event.target as HTMLInputElement;
    const { files: fileList } = target;
    const files = [...fileList || []];
    if (files && Array.isArray(files) && files.length > 0) {
      state.preparedFiles = await prepareSharedFiles(
        files,
        props.listedFiles,
        props.deviceName,
        props.ownerId,
      );
      if (state.preparedFiles.length === 0) {
        state.showPrepareFilesModal = false;
      }
      document.body.removeChild(element);
    }
  };
  document.body.appendChild(element);
  element.click();
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
    return emit(
      'handle-add-file',
      {
        ...file,
        withPassword: !!password,
      },
    );
  });
};

const togglePrepareFilesModal = (): void => {
  state.showPrepareFilesModal = !state.showPrepareFilesModal;
};
</script>

<template>
  <PrepareFilesModalComponent
    v-if="state.showPrepareFilesModal"
    :is-mobile="props.isMobile"
    :prepared-files="state.preparedFiles"
    @close-modal="togglePrepareFilesModal"
    @handle-share-files="handleShareFiles"
  />
  <header
    :class="`f ai-center j-space-between ${props.isMobile
      ? 'mh-1'
      : 'mh-2'}`"
  >
    <div class="f ai-center">
      <div class="f ai-center">
        <LogoIconComponent :color="COLORS.accent" />
      </div>
      <div :class="`ns title ${props.isMobile ? 'ml-half' : 'ml-1'}`">
        EXCHANGE
      </div>
    </div>
    <div class="f ai-center ml-1">
      <StyledButtonComponent
        title="Add files"
        :custom-styles="{ height: `${SPACER * 2}px` }"
        :with-icon="true"
        @handle-click="handleUploadButton"
      >
        <UplaodIconComponent />
      </StyledButtonComponent>
      <StyledButtonComponent
        title="Settings"
        :custom-styles="{ height: `${SPACER * 2}px` }"
        :global-classes="[`${props.isMobile ? 'ml-half' : 'ml-1'}`]"
        :with-icon="true"
        @handle-click="emit('toggle-settings-modal')"
      >
        <SettingsIconComponent />
      </StyledButtonComponent>
    </div>
  </header>
</template>

<style scoped>
header {
  height: calc(var(--spacer) * 3);
}
.title {
  color: var(--accent);
  font-size: calc(var(--spacer) * 1.25);
  font-weight: 300;
}
</style>
