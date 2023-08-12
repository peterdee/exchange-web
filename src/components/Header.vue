<script setup lang="ts">
import { COLORS, EVENTS, SPACER } from '../configuration';
import connection from '../connection';
import type { ListedFile } from '../types';
import LogoIconComponent from './icons/LogoIcon.vue';
import prepareSharedFiles from '../utilities/prepare-shared-files';
import SettingsIconComponent from './icons/SettingsIcon.vue';
import StyledButtonComponent from './elements/StyledButton.vue';
import UplaodIconComponent from './icons/UploadIcon.vue';

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

const handleUploadButton = (): void => {
  const element = window.document.createElement('input');
  element.multiple = true;
  element.type = 'file';
  document.body.appendChild(element);
  element.click();
  element.onchange = async (event: Event): Promise<void> => {
    const target = event.target as HTMLInputElement;
    const { files: fileList } = target;
    const files = [...fileList || []];
    if (files && Array.isArray(files) && files.length > 0) {
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
              size: entry.size,
            },
          );
        }
        emit('handle-add-file', entry);
      });
    }
    document.body.removeChild(element);
  };
};
</script>

<template>
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
