<script setup lang="ts">
import { reactive } from 'vue';

import connection from '../../connection';
import DeleteIconComponent from '../icons/DeleteIcon.vue';
import formatFileSize from '../../utilities/format-file-size';
import { EVENTS, SPACER } from '../../configuration';
import { setValue } from '../../utilities/storage';
import SettingsIconComponent from '../icons/SettingsIcon.vue';
import store from '../../store';
import StyledButtonComponent from '../elements/StyledButton.vue';
import StyledInputComponent from '../elements/StyledInput.vue';
import StyledSwitchComponent from '../elements/StyledSwitch.vue';

interface ComponentState {
  deviceName: string;
  isClosing: boolean;
}

const emit = defineEmits([
  'close-modal',
  'update-device-name',
]);

const props = defineProps<{
  sharedFiles: number;
}>();

const state = reactive<ComponentState>({
  deviceName: store.deviceName,
  isClosing: false,
});

const handleInput = ({ value }: { value: string }) => {
  state.deviceName = value;
};

const handleCloseModal = () => {
  state.isClosing = true;
  setTimeout(
    () => emit('close-modal'),
    240,
  );
};

const handleDeleteAllFiles = () => {
  if (connection.io.connected) {
    connection.io.emit(EVENTS.deleteAllFiles);
  }
  store.listedFiles = [];
};

const handleSubmitNewDeviceName = () => {
  if (connection.io.connected && state.deviceName !== store.deviceName
    && store.listedFiles.some((item) => item.ownerId === connection.io.id)) {
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
    () => emit('update-device-name', state.deviceName),
    240,
  );
};

const handleAutoSaveSwitch = () => {
  const newValue = !store.autoSaveDownloadedFiles;
  setValue('autoSaveDownloadedFiles', newValue);
  store.autoSaveDownloadedFiles = newValue;
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
      <div class="ns title fw-500">
        Device name
      </div>
      <form
        class="f d-col mt-half"
        @submit.prevent="handleSubmitNewDeviceName"
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
          Update device name
        </StyledButtonComponent>
      </form>
      <div class="mv-1 divider" />
      <StyledSwitchComponent
        :checked="store.autoSaveDownloadedFiles"
        :global-classes="['input-title']"
        :labelText="'Auto-save downloaded files'"
        @handle-switch="handleAutoSaveSwitch"
      />
      <div class="mv-1 divider" />
      <div class="ns title fw-500">
        Server configuration
      </div>
      <span class="mt-half input-title ns">
        Chunk size: {{ formatFileSize(store.serverConfiguration.chunkSizeBytes) }}
      </span>
      <span class="mt-half input-title ns">
        Maximum single file size: {{
          formatFileSize(store.serverConfiguration.maxFileSizeBytes)
        }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.title {
  font-size: calc(var(--spacer) * 1.25);
}
</style>
