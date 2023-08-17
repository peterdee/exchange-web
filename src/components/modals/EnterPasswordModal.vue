<script setup lang="ts">
import { reactive } from 'vue';
import type { Socket } from 'socket.io-client';

import type {
  AcknowledgementMessage,
  ListedFile,
} from '../../types';
import connection from '../../connection';
import { EVENTS, MESSAGES, SPACER } from '../../configuration';
import DeleteIconComponent from '../icons/DeleteIcon.vue';
import LockIconComponent from '../icons/LockIcon.vue';
import sleep from '../../utilities/sleep';
import StyledButtonComponent from '../elements/StyledButton.vue';
import StyledInputComponent from '../elements/StyledInput.vue';

interface ComponentState {
  errorMessage: string;
  isClosing: boolean;
  isLoading: boolean;
  password: string;
  passwordError: boolean;
}

const emit = defineEmits([
  'close-modal',
  'handle-download-file',
  'handle-store-grant',
]);

const props = defineProps<{
  isMobile: boolean;
  listedFile: ListedFile;
}>();

const state = reactive<ComponentState>({
  errorMessage: '',
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
  state.errorMessage = '';
  state.password = value;
  state.passwordError = false;
};

const handleSubmit = async (): Promise<null | Socket> => {
  const trimmedPassword = (state.password || '').trim();
  if (!(connection.io.connected && trimmedPassword)) {
    return null;
  }
  state.isLoading = true;
  await sleep(500);
  return connection.io.emit(
    EVENTS.requestGrant,
    {
      fileId: props.listedFile.id,
      ownerId: props.listedFile.ownerId,
      password: trimmedPassword,
    },
    (response: AcknowledgementMessage<{ grant: string } | null>): null | void => {
      state.isLoading = false;
      const { info, status } = response;
      if (status === 400) {
        if (info === MESSAGES.fileNotFound) {
          state.errorMessage = 'File not found!';
        }
        if (info === MESSAGES.fileOwnerDisconnected) {
          state.errorMessage = 'File owner disconnected!';
        }
        if (info === MESSAGES.invalidData) {
          state.errorMessage = 'Provided data is invalid!';
        }
        if (info === MESSAGES.missingRequiredData) {
          state.errorMessage = 'Required data is missing!';
        }
        state.passwordError = true;
        return null;
      }
      if (status === 401) {
        state.errorMessage = 'Provided password is invalid!';
        state.passwordError = true;
        return null;
      }
      const { data } = response;
      if (data && data.grant) {
        emit(
          'handle-store-grant',
          {
            fileId: props.listedFile.id,
            grant: data.grant,
          },
        );
        const delayedAction = (): void => emit(
          'handle-download-file',
          {
            fileId: props.listedFile.id,
            grant: data.grant,
            ownerId: props.listedFile.ownerId,
          },
        );
        return handleCloseModal(delayedAction);
      }
      state.errorMessage = 'Something went wrong...';
      state.passwordError = true;
      return null;
    },
  )
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
        File {{ props.listedFile.name }} requires password
      </div>
      <div class="ns mt-half input-title">
        Please enter file password to proceed
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
        <div class="f ai-center j-center error-block">
          <div
            v-if="state.passwordError"
            class="ns t-center error-text"
          >
            {{ state.errorMessage }}
          </div>
        </div>
        <StyledButtonComponent
          type="submit"
          :disabled="!state.password || !(state.password || '').trim() || state.isLoading"
          :globalClasses="['mt-half']"
          :is-loading="state.isLoading"
          :is-positive="true"
          :with-spinner="true"
        >
          Download file
        </StyledButtonComponent>
      </form>
    </div>
  </div>
</template>

<style scoped>
.error-block {
  height: calc(var(--spacer) * 3);
}
.error-text {
  color: var(--negative);
  font-size: calc(var(--spacer) * 1.25);
  font-weight: 300;
}
</style>
