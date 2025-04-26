<script setup lang="ts">
import StyledButtonComponent from './elements/StyledButton.vue';
import StyledSpinnerComponent from './elements/StyledSpinner.vue';

const props = defineProps<{ local: boolean }>();

const handleUsePublic = () => window.location.replace(window.location.origin);
</script>

<template>
  <div class="f d-col ns">
    <span class="t-center input-title">
      Connecting to the {{ props.local ? 'local ' : '' }}server
    </span>
    <div class="f ai-center j-center mt-1 mh-auto spinner-background">
      <StyledSpinnerComponent />
    </div>
    <template v-if="props.local">
      <StyledButtonComponent
        :globalClasses="['mt-2']"
        @handle-click="handleUsePublic"
      >
        Use public server
      </StyledButtonComponent>
    </template>
  </div>
</template>

<style scoped>
.spinner-background {
  background-color: var(--accent);
  border-radius: 50%;
  height: calc(var(--spacer) * 3);
  width: calc(var(--spacer) * 3);
}
</style>
