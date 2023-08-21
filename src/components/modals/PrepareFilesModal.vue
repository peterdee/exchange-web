<script setup lang="ts">
import { reactive } from 'vue';

import DeleteIconComponent from '../icons/DeleteIcon.vue';
import InfoIconComponent from '../icons/InfoIcon.vue';
import { SPACER } from '../../configuration';
import StyledButtonComponent from '../elements/StyledButton.vue';

interface ComponentState {
  isClosing: boolean;
}

const emit = defineEmits(['close-modal']);

const props = defineProps<{
  isMobile: boolean;
}>();

const state = reactive<ComponentState>({
  isClosing: false,
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
          Prepare
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
    </div>
  </div>
</template>