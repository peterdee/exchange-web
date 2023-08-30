<script setup lang="ts">
import { reactive } from 'vue';
import type { Socket } from 'socket.io-client';

import type { AcknowledgementMessage, ListedFile } from '../../types';
import DeleteIconComponent from '../icons/DeleteIcon.vue';
import { EVENTS, SPACER } from '../../configuration';
import LockIconComponent from '../icons/LockIcon.vue';
import sleep from '../../utilities/sleep';
import store from '../../store';
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
  'handle-file-password',
]);

const props = defineProps<{
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

const handleInput = ({ value = '' }: { value: string }): void => {
  state.password = value;
  state.passwordError = false;
};

const handleRemovePassword = async (): Promise<null | Socket | void> => {
  if (store.io.connected) {
    state.isLoading = true;
    await sleep();
    store.io.emit(
      EVENTS.removePassword,
      {
        fileId: props.listedFile.id,
        ownerId: store.io.id,
      },
    );
    const delayedAction = (): void => emit(
      'handle-file-password',
      {
        fileId: props.listedFile.id,
        withPassword: false,
      },
    );
    return handleCloseModal(delayedAction);
  }
  state.isLoading = false;
  return null;
};

const handleSubmit = async (): Promise<null | Socket | void> => {
  const trimmedPassword = (state.password || '').trim();
  if (!trimmedPassword) {
    state.passwordError = true;
    return null;
  }
  if (store.io.connected) {
    state.isLoading = true;
    await sleep();
    return store.io.emit(
      EVENTS.changePassword,
      {
        fileId: props.listedFile.id,
        ownerId: store.io.id,
        password: trimmedPassword,
      },
      (response: AcknowledgementMessage): null | void => {
        const { status } = response;
        if (status && status === 200) {
          const delayedAction = (): void => emit(
            'handle-file-password',
            {
              fileId: props.listedFile.id,
              withPassword: true,
            },
          );
          return handleCloseModal(delayedAction);
        }
        state.passwordError = true;
        return null;
      },
    );
  }
  state.isLoading = false;
  state.passwordError = true;
  return null;
};
</script>

<template>
  <div
    :class="`f d-col j-center modal-background ${state.isClosing
      ? 'fade-out'
      : 'fade-in'}`"
    @mousedown="(): void => handleCloseModal()"
  >
    <div
      :class="`f d-col mh-auto p-1 modal-content ${store.isMobile
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
            ? 'Change'
            : 'Add'} password for file ${props.listedFile.fileName}`
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
          :disabled="state.isLoading"
          :value="state.password"
          :with-error="state.passwordError"
          @handle-input="handleInput"
        />
        <StyledButtonComponent
          type="submit"
          :disabled="!state.password || !state.password.trim() || state.isLoading"
          :globalClasses="['mt-half']"
          :is-loading="state.isLoading"
          :with-spinner="true"
        >
          {{
            `${props.listedFile.withPassword
              ? 'Change'
              : 'Add'} password`
          }}
        </StyledButtonComponent>
      </form>
      <template v-if="props.listedFile.withPassword">
        <div class="mv-1 divider" />
        <StyledButtonComponent
          :disabled="state.isLoading"
          :is-loading="state.isLoading"
          :is-negative="true"
          :with-spinner="true"
          @handle-click="handleRemovePassword"
        >
          Remove password
        </StyledButtonComponent>
      </template>
    </div>
  </div>
</template>
