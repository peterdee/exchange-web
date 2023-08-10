<script setup lang="ts">
import { reactive } from 'vue';

import DeleteIconComponent from './DeleteIcon.vue';
import FileIconComponent from './FileIcon.vue';
import formatDate from '../utilities/format-date';
import formatFileSize from '../utilities/format-file-size';
import type { ListedFile } from '../types';
import { SPACER } from '../configuration';
import StyledButtonComponent from './StyledButton.vue';

interface ComponentState {
  isClosing: boolean;
  newPassword: string;
  showPasswordModal: boolean;
}

const emit = defineEmits([
  'close-modal',
  'download-file',
  'toggle-password-modal',
]);

const props = defineProps<{
  isMobile: boolean;
  listedFile: ListedFile;
}>();

const state = reactive<ComponentState>({
  isClosing: false,
  newPassword: '',
  showPasswordModal: false,
});

const handleCloseModal = (): void => {
  state.isClosing = true;
  setTimeout(
    (): void => emit('close-modal'),
    240,
  );
};

const handleDownload = (): void => {
  state.isClosing = true;
  setTimeout(
    (): void => emit(
      'download-file',
      {
        fileId: props.listedFile.id,
        ownerId: props.listedFile.ownerId,
      },
    ),
    240,
  );
};

const handleShowPasswordModal = (): void => {
  emit('toggle-password-modal', props.listedFile.id);
  return handleCloseModal();
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
          <FileIconComponent :size="SPACER * 2" />
          <span class="mh-1 modal-title">
            Details
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
      <div class="mt-half ns input-title">
        Added: {{ `${formatDate(props.listedFile.createdAt)}${!props.listedFile.isOwner
          ? ' (owner time)'
          : ''}` }}
      </div>
      <div class="mt-half ns input-title">
        File name: {{ props.listedFile.name }}
      </div>
      <div class="mt-half ns input-title">
        File size: {{ formatFileSize(props.listedFile.size) }}
      </div>
      <template v-if="!props.listedFile.isOwner">
        <div class="mt-half ns input-title">
          Owner: {{ props.listedFile.deviceName }}
        </div>
      </template>
      <div class="divider mv-1" />
      <template v-if="!props.listedFile.isOwner">
        <div class="ns input-title">
          {{
            props.listedFile.withPassword
              ? 'This file is protected by password'
              : 'This file is not protected by password'
          }}
        </div>
        <StyledButtonComponent
          :globalClasses="['mt-half']"
          :is-positive="true"
          @handle-click="handleDownload"
        >
          Download file
        </StyledButtonComponent>
      </template>
      <template v-if="props.listedFile.isOwner">
        <div class="f ns input-title">
          <span>
            Password protection:
          </span>
          <span 
            :class="`ml-half ${props.listedFile.withPassword
              ? 'ok'
              : 'error'}`"
          >
            {{ 
              props.listedFile.withPassword
                ? ' enabled'
                : ' disabled'
            }}
          </span>
        </div>
        <StyledButtonComponent
          :globalClasses="['mt-half']"
          @handle-click="handleShowPasswordModal"
        >
          {{
            props.listedFile.withPassword
              ? 'Edit password'
              : 'Add password'
          }}
        </StyledButtonComponent>
      </template>
    </div>
  </div>
</template>

<style scoped>
.error {
  color: var(--error);
}
.ok {
  color: var(--success);
}
</style>
