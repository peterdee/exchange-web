<script setup lang="ts">
import { reactive } from 'vue';

import DeleteIconComponent from './DeleteIcon.vue';
import type { ListedFile } from '../types';
import LockIconComponent from './LockIcon.vue';
import { SPACER } from '../configuration';
import StyledButtonComponent from './StyledButton.vue';
import StyledInputComponent from './StyledInput.vue';

interface ComponentState {
  isClosing: boolean;
  newPassword: string;
  oldPassword: string;
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
  oldPassword: '',
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
    (): void => {},
    240,
  );
};
</script>

<template>
  <div
    :class="`f d-col j-center modal-background ${state.isClosing
      ? 'fade-out'
      : 'fade-in'}`"
    @mousedown="handleCloseModal"
  >
    <div
      :class="`f d-col mh-auto p-1 modal-content ${props.isMobile
        ? 'modal-content-mobile'
        : 'modal-content-web'}`"
      @mousedown.stop
    >
      <div class="f ai-center j-space-between ns">
        <div class="f ai-center">
          <LockIconComponent :size="SPACER * 2" />
          <span class="mh-1 modal-title">
            Password
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
        {{
          `${props.listedFile.withPassword
            ? 'Update'
            : 'Add'} password for file ${props.listedFile.name}`
        }}
      </div>
      <form
        class="f d-col mt-half"
        @submit.prevent="handleSubmit"
      >
        <StyledInputComponent
          name="filePassword"
          placeholder="File password"
          type="password"
          :value="state.newPassword"
          @handle-input="handleInput"
        />
        <StyledButtonComponent
          type="submit"
          :disabled="state.newPassword.length === 0"
          :globalClasses="['mt-half']"
        >
          Set password
        </StyledButtonComponent>
      </form>
    </div>
  </div>
</template>
