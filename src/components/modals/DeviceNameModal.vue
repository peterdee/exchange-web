<script setup lang="ts">
import { reactive } from 'vue';

import LogoIconComponent from '../icons/LogoIcon.vue';
import { SPACER } from '../../configuration';
import StyledButtonComponent from '../elements/StyledButton.vue';
import StyledInputComponent from '../elements/StyledInput.vue';

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
    :class="`f d-col j-center modal-background blur ${state.isClosing
      ? 'fade-out'
      : 'fade-in'}`"
  >
    <div
      :class="`f d-col mh-auto p-1 modal-content ${props.isMobile
        ? 'modal-content-mobile'
        : 'modal-content-web'}`"
    >
      <div class="f ai-center">
        <LogoIconComponent :size="SPACER * 2.25" />
        <span class="mh-1 modal-title">
          EXCHANGE
        </span>
      </div>
      <div class="ns mt-half input-title">
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
.blur {
  backdrop-filter: blur(var(--spacer));
}
</style>
