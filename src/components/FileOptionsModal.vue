<script setup lang="ts">
import { reactive } from 'vue';

import type { ListedFile } from '../types';
import StyledButtonComponent from './StyledButton.vue';
import StyledInputComponent from './StyledInput.vue';

interface ComponentState {
  isClosing: boolean;
  newPassword: string;
}

// TODO: move all of the related logic into this modal

const emit = defineEmits(['handle-file-privacy']);

const props = defineProps<{
  listedFile: ListedFile;
}>();

const state = reactive<ComponentState>({
  isClosing: false,
  newPassword: '',
});

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
  >
    <div class="f d-col mh-auto j-space-around p-1 content">
      <div class="ns t-center title">
        EXCHANGE
      </div>
      <div class="t-center ns subtitle">
        Set file password
      </div>
      <form
        class="f d-col"
        @submit.prevent="handleSubmit"
      >
        <StyledInputComponent
          name="filePassword"
          placeholder="File password"
          type="password"
          @handle-input="handleInput"
          :value="state.newPassword"
        />
        <StyledButtonComponent
          type="submit"
          :disabled="state.newPassword.length === 0"
          :globalClasses="['mt-1']"
        >
          Set password
        </StyledButtonComponent>
      </form>
    </div>
  </div>
</template>

<style scoped>
.background {
  backdrop-filter: blur(var(--spacer));
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
  height: calc(var(--spacer) * 17);
  width: calc(var(--spacer) * 30);
}
.subtitle {
  font-size: calc(var(--spacer) * 1.5);
  font-weight: 300;
}
.title {
  color: var(--accent);
  font-size: calc(var(--spacer) * 2.5);
  font-weight: 200;
}
</style>
