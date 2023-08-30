<script setup lang="ts">
import { reactive } from 'vue';

import DeleteIconComponent from '../icons/DeleteIcon.vue';
import { EVENTS, SPACER } from '../../configuration';
import type { ListedFile } from '../../types';
import SettingsIconComponent from '../icons/SettingsIcon.vue';
import store from '../../store';
import StyledButtonComponent from '../elements/StyledButton.vue';
import StyledInputComponent from '../elements/StyledInput.vue';

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
  if (store.io.connected) {
    store.io.emit(EVENTS.deleteAllFiles);
  }
  state.isClosing = true;
  setTimeout(
    (): void => emit('delete-all-files'),
    240,
  );
};

const handleSubmit = (): void => {
  if (store.io.connected && state.deviceName !== props.deviceName
    && store.listedFiles.some((item: ListedFile): boolean => item.ownerId === store.io.id)) {
    store.io.emit(
      EVENTS.updateDeviceName,
      {
        newDeviceName: state.deviceName,
        ownerId: store.io.id,
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
    :class="`f d-col j-center modal-background ${state.isClosing
      ? 'fade-out'
      : 'fade-in'}`"
    @mousedown="handleCloseModal"
  >
    <div
      :class="`f d-col mh-auto p-1 modal-content ${store.isMobile
        ? 'modal-content-mobile'
        : 'modal-content-web'}`"
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
          :disabled="props.sharedFiles === 0 || !store.io.connected"
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
