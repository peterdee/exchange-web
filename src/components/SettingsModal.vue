<script setup lang="ts">
import { reactive } from 'vue';

import connection from '../connection';
import DeleteIconComponent from './DeleteIcon.vue';
import SettingsIconComponent from './SettingsIcon.vue';
import { EVENTS, SPACER } from '../configuration';
import StyledButtonComponent from './StyledButton.vue';
import StyledInputComponent from './StyledInput.vue';

interface ComponentState {
  deviceName: string;
  isClosing: boolean;
}

const emit = defineEmits([
  'close-modal',
  'delete-all-files',
  'update-device-name',
]);

const props = defineProps<{
  deviceName: string;
  isMobile: boolean;
  sharedFiles: number;
}>();

const state = reactive<ComponentState>({
  deviceName: props.deviceName,
  isClosing: false,
});

const handleInput = ({ value }: { value: string }): void => {
  state.deviceName = value;
};

const handleCloseModal = (): void => {
  state.isClosing = true;
  setTimeout(
    (): void => emit('close-modal'),
    240,
  );
};

const handleDeleteAllFiles = (): void => {
  if (connection.io.connected) {
    connection.io.emit(EVENTS.deleteAllFiles);
  }
  state.isClosing = true;
  setTimeout(
    (): void => emit('delete-all-files'),
    240,
  );
};

const handleSubmit = (): void => {
  if (connection.io.connected) {
    connection.io.emit(
      EVENTS.updateDeviceName,
      {
        newDeviceName: state.deviceName,
        ownerId: connection.io.id,
      },
    );
  }
  state.isClosing = true;
  setTimeout(
    (): void => emit('update-device-name', state.deviceName),
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
          <SettingsIconComponent :size="SPACER * 2" />
          <span class="mh-1 modal-title">
            Settings
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
      <div class="f d-col mt-half ns">
        <span class="input-title">
          Device name: {{ props.deviceName }}
        </span>
        <span class="mt-half input-title">
          Shared files: {{ props.sharedFiles }}
        </span>
        <StyledButtonComponent
          type="button"
          :disabled="props.sharedFiles === 0 || !connection.io.connected"
          :global-classes="['mt-half']"
          :is-negative="true"
          @handle-click="handleDeleteAllFiles"
        >
          Delte all of my shared files
        </StyledButtonComponent>
      </div>
      <div class="mv-1 divider" />
      <div class="ns input-title">
        Update device name
      </div>
      <form
        class="f d-col mt-half"
        @submit.prevent="handleSubmit"
      >
        <StyledInputComponent
          name="deviceName"
          placeholder="Device name"
          type="text"
          :value="state.deviceName"
          @handle-input="handleInput"
        />
        <StyledButtonComponent
          type="submit"
          :disabled="state.deviceName.length === 0"
          :globalClasses="['mt-half']"
        >
          Update
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
  min-height: calc(var(--spacer) * 17);
  z-index: 11;
}
.content-mobile {
  max-width: calc(var(--spacer) * 30);
  width: calc(100% - var(--spacer));
}
.content-web {
  width: calc(var(--spacer) * 30);
}
.input-title {
  font-size: calc(var(--spacer) * 1.25);
  font-weight: 300;
}
</style>
