<script setup lang="ts">
import { reactive } from 'vue';

import { COLORS, SPACER } from '../../configuration';
import DangerIconComponent from '../icons/DangerIcon.vue';
import DeleteIconComponent from '../icons/DeleteIcon.vue';
import StyledButtonComponent from '../elements/StyledButton.vue';

interface ComponentState {
  isClosing: boolean;
}

const emit = defineEmits(['close-modal']);

const props = defineProps<{
  isMobile: boolean;
  message: string;
}>();

const state = reactive<ComponentState>({ isClosing: false });

const handleCloseModal = (): void => {
  state.isClosing = true;
  setTimeout(
    (): void => emit('close-modal'),
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
        <DangerIconComponent
          :color="COLORS.error"
          :size="SPACER * 2"
        />
        <span class="mh-1 modal-title error-title">
          Error
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
        {{ props.message }}
      </div>
      <StyledButtonComponent
        :globalClasses="['mt-half']"
        :is-negative="true"
        @handle-click="handleCloseModal"
      >
        OK
      </StyledButtonComponent>
    </div>
  </div>
</template>

<style scoped>
.error-title {
  color: var(--negative);
}
</style>
