<script setup lang="ts">
import { onMounted, reactive } from 'vue';

import { COLORS, SPACER } from '../../configuration';
import CrossIconComponent from '../icons/CrossIcon.vue';
import DeleteIconComponent from '../icons/DeleteIcon.vue';
import InfoIconComponent from '../icons/InfoIcon.vue';
import type { ListedFile } from '../../types';
import StyledButtonComponent from '../elements/StyledButton.vue';
import StyledInputComponent from '../elements/StyledInput.vue';

interface ComponentState {
  isClosing: boolean;
  isLoading: boolean;
  listedFiles: ListedFile[];
  password: string;
}

const emit = defineEmits([
  'close-modal',
  'handle-share-files',
]);

const props = defineProps<{
  isMobile: boolean;
  preparedFiles: ListedFile[];
}>();

const state = reactive<ComponentState>({
  isClosing: false,
  isLoading: false,
  listedFiles: [],
  password: '',
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

const handleRemoveFile = (fileId: string): void => {
  state.listedFiles = state.listedFiles.filter(
    (item: ListedFile): boolean => item.id !== fileId,
  );
  if (state.listedFiles.length === 0) {
    handleCloseModal();
  }
};

onMounted((): void => {
  state.listedFiles = props.preparedFiles;
});
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
        <InfoIconComponent :size="SPACER * 2" />
        <span class="mh-1 modal-title">
          {{ `Prepare${!props.isMobile ? ' files' : ''}` }}
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
        These files are going to be shared
      </div>
      <div class="mt-half p-1 ns list">
        <div
          v-for="item in state.listedFiles"
          class="f ai-center j-space-between"
          :key="item.id"
        >
          <span>
            {{ item.fileName }}
          </span>
          <StyledButtonComponent
            title="Remove file"
            :custom-styles="{
              height: `${SPACER * 1.5}px`,
            }"
            :with-icon="true"
            @handle-click="(): void => handleRemoveFile(item.id)"
          >
            <CrossIconComponent
              :color="COLORS.error"
              :size="SPACER * 1.5"
            />
          </StyledButtonComponent>
        </div>
      </div>
      <div class="mv-half ns input-title">
        <span class="mr-half">
          Password protection:
        </span>
        <span :class="`${!!state.password ? 'ok' : 'error'}`">
          {{ !!state.password ? 'enabled' : 'disabled' }}
        </span>
      </div>
      <StyledInputComponent
        name="password"
        placeholder="Add password"
        type="password"
        :disabled="state.isLoading"
        :value="state.password"
        @handle-input="handleInput"
      />
      <StyledButtonComponent
        :disabled="state.isLoading || state.isClosing"
        :global-classes="['mt-half']"
      >
        Share files
      </StyledButtonComponent>
    </div>
  </div>
</template>

<style scoped>
.error {
  color: var(--negative);
}
.icon {
  height: calc(var(--spacer) * 1.75);
  width: calc(var(--spacer) * 1.75);
}
.list {
  background-color: var(--muted-super-light);
  border-radius: var(--spacer-half);
  height: calc(var(--spacer) * 10);
  overflow-y: scroll;
}
.ok {
  color: var(--success);
}
</style>
