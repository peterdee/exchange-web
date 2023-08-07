<script setup lang="ts">
import { COLORS, SPACER } from '../configuration';
import LogoIconComponent from './LogoIcon.vue';
import SettingsIconComponent from './SettingsIcon.vue';
import StyledButtonComponent from './StyledButton.vue';
import UplaodIconComponent from './UploadIcon.vue';

const props = defineProps<{
  isMobile: boolean;
}>();

const emit = defineEmits([
  'handle-files',
  'toggle-settings-modal',
]);

const handleUploadButton = (): void => {
  const element = window.document.createElement('input');
  element.multiple = true;
  element.type = 'file';
  document.body.appendChild(element);
  element.click();
  element.onchange = (event: Event): void => {
    document.body.removeChild(element);
    const target = event.target as HTMLInputElement;
    const { files } = target;
    if (files && Array.isArray(files) && files.length > 0) {
      // TODO: handle file processing here
      emit('handle-files', files);
    }
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
        title="Add file"
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
