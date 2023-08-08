<script setup lang="ts">
import { reactive } from 'vue';

import DeleteIconComponent from './DeleteIcon.vue';
import FileIconComponent from './FileIcon.vue';
import type { ListedFile } from '../types';
import { SPACER } from '../configuration';
import StyledButtonComponent from './StyledButton.vue';
import StyledInputComponent from './StyledInput.vue';
import StyledSwitchComponent from './StyledSwitch.vue';

interface ComponentState {
  isClosing: boolean;
  newPassword: string;
}

const emit = defineEmits([
  'close-modal',
  'handle-file-privacy',
]);

const props = defineProps<{
  isMobile: boolean;
  listedFile: ListedFile;
}>();

const state = reactive<ComponentState>({
  isClosing: false,
  newPassword: '',
});

const handleCloseModal = (): void => {
  state.isClosing = true;
  setTimeout(
    (): void => emit('close-modal'),
    240,
  );
};

const handleInput = ({ value }: { value: string }): void => {
  state.newPassword = value;
};

const handleSubmit = (): void => {
  state.isClosing = true;
  setTimeout(
    (): void => emit('handle-file-privacy', { fileId: props.listedFile.id, }),
    240,
  );
};
</script>

<template>
  <div
    :class="`f d-col j-center background ${state.isClosing
      ? 'fade-out'
      : 'fade-in'}`"
    @mousedown="handleCloseModal"
  >
    <div
      :class="`f d-col mh-auto p-1 content ${props.isMobile
        ? 'content-mobile'
        : 'content-web'}`"
      @mousedown.stop
    >
      <div class="f ai-center j-space-between ns">
        <div class="f ai-center">
          <FileIconComponent :size="SPACER * 2" />
          <span class="mh-1 modal-title">
            Details
          </span>
        </div>
        <StyledButtonComponent
          title="Close"
          :custom-styles="{ height: `${SPACER * 2.25}px` }"
          :with-icon="true"
          @handle-click="handleCloseModal"
        >
          <DeleteIconComponent
            :color="'gray'"
            :size="SPACER * 2.25"
          />
        </StyledButtonComponent>
      </div>
      <div class="divider mv-1" />
      <StyledSwitchComponent
        label="Protect file with password"
        name="password"
        :disabled="false"
        :is-checked="props.listedFile.withPassword"
        @toggle-switch="(): void => { props.listedFile.withPassword = !props.listedFile.withPassword }"
      />
      <form
        class="f d-col mt-half"
        @submit.prevent="handleSubmit"
      >
        <StyledInputComponent
          name="filePassword"
          placeholder="File password"
          type="password"
          :disabled="!props.listedFile.withPassword"
          :value="state.newPassword"
          @handle-input="handleInput"
        />
        <StyledButtonComponent
          type="submit"
          :disabled="!props.listedFile.withPassword || state.newPassword.length === 0"
          :globalClasses="['mt-half']"
        >
          Set password
        </StyledButtonComponent>
      </form>
    </div>
  </div>
</template>

<style scoped>
.background {
  background-color: rgba(0, 0, 0, .6);
  height: 100%;
  left: 0;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 10;
}
.content {
  background-color: rgba(255, 255, 255, 1);
  border-radius: var(--spacer-half);
  min-height: var(--spacer);
}
.content-mobile {
  max-width: calc(var(--spacer) * 30);
  width: calc(100% - var(--spacer));
}
.content-web {
  width: calc(var(--spacer) * 30);
}
</style>
