<script setup lang="ts">
import { reactive } from 'vue';

import DeleteIconComponent from '../icons/DeleteIcon.vue';
import type { ListedFile } from '../../types';
import LockIconComponent from '../icons/LogoIcon.vue';
import { SPACER } from '../../configuration';
import StyledButtonComponent from '../elements/StyledButton.vue';
import StyledInputComponent from '../elements/StyledInput.vue';

interface ComponentState {
  isClosing: boolean;
  isLoading: boolean;
  password: string;
  passwordError: boolean;
}

const emit = defineEmits([
  'close-modal',
  'handle-download-file',
]);

const props = defineProps<{
  isMobile: boolean;
  listedFile: ListedFile;
}>();

const state = reactive<ComponentState>({
  isClosing: false,
  isLoading: false,
  password: '',
  passwordError: false,
});

const handleCloseModal = (delayedAction?: () => void): void => {
  state.isClosing = true;
  setTimeout(
    (): void => {
      if (delayedAction) {
        delayedAction();
      }
      return emit('close-modal');
    },
    240,
  );
};

const handleInput = ({ value }: { value: string }): void => {
  state.password = value;
};

const handleSubmit = (): void => {
  state.isClosing = true;
  setTimeout(
    (): void => emit('handle-download-file', state.password),
    240,
  );
};
</script>

<template>
  <div
    :class="`f d-col j-center modal-background ${state.isClosing
      ? 'fade-out'
      : 'fade-in'}`"
  >
    <div
      :class="`f d-col mh-auto p-1 modal-content ${props.isMobile
        ? 'modal-content-mobile'
        : 'modal-content-web'}`"
    >
    <div class="f ai-center j-space-between ns">
      <div class="f ai-center">
        <LockIconComponent :size="SPACER * 2" />
        <span class="mh-1 modal-title">
          Protected
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
      <div class="ns mt-half input-title">
        This file ({{ props.listedFile.name }}) is protected
      </div>
      <div class="ns mt-half input-title">
        Please enter file password to download the file
      </div>
      <form
        class="f d-col mt-half"
        @submit.prevent="handleSubmit"
      >
        <StyledInputComponent
          name="filePassword"
          placeholder="File password"
          type="password"
          :disabled="state.isLoading"
          :value="state.password"
          :with-error="state.passwordError"
          @handle-input="handleInput"
        />
        <StyledButtonComponent
          type="submit"
          :disabled="!state.password || !(state.password || '').trim()"
          :globalClasses="['mt-half']"
          :is-positive="true"
        >
          Download
        </StyledButtonComponent>
      </form>
    </div>
  </div>
</template>
