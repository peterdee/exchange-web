<script setup lang="ts">
import { reactive } from 'vue';

import LogoIconComponent from './LogoIcon.vue';
import { SPACER } from '../configuration';
import StyledButtonComponent from './StyledButton.vue';
import StyledInputComponent from './StyledInput.vue';

interface ComponentState {
  deviceName: string;
  isClosing: boolean;
}

const emit = defineEmits(['handle-device-name']);

const props = defineProps<{ isMobile: boolean }>();

const state = reactive<ComponentState>({
  deviceName: '',
  isClosing: false,
});

const handleInput = ({ value }: { value: string }): void => {
  state.deviceName = value;
};

const handleSubmit = (): void => {
  state.isClosing = true;
  setTimeout(
    (): void => emit('handle-device-name', state.deviceName),
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
    <div
      :class="`f d-col mh-auto p-1 content ${props.isMobile
        ? 'content-mobile'
        : 'content-web'}`"
    >
      <div class="f ai-center">
        <LogoIconComponent :size="SPACER * 2.25" />
        <span class="mh-1 modal-title">
          EXCHANGE
        </span>
      </div>
      <div class="ns input-title">
        Please set your device name to continue
      </div>
      <form
        class="f d-col mt-half"
        @submit.prevent="handleSubmit"
      >
        <StyledInputComponent
          name="deviceName"
          placeholder="Device name"
          type="text"
          @handle-input="handleInput"
          :value="state.deviceName"
        />
        <StyledButtonComponent
          type="submit"
          :disabled="state.deviceName.length === 0"
          :globalClasses="['mt-half']"
        >
          Continue
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
  min-height: var(--spacer);
  z-index: 11;
}
.content-mobile {
  max-width: calc(var(--spacer) * 30);
  width: calc(100% - var(--spacer));
}
.content-web {
  width: calc(var(--spacer) * 30);
}
</style>
