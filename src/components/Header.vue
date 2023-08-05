<script setup lang="ts">
import { COLORS } from '../configuration';
import LogoIconComponent from './LogoIcon.vue';

const props = defineProps<{
  isMobile: boolean;
}>();
</script>

<template>
  <header
    :class="`f ai-center j-space-between ${props.isMobile
      ? 'mh-1'
      : 'mh-2'}`"
  >
    <div class="f ai-center">
      <div class="f ai-center">
        <LogoIconComponent :color="COLORS.accent" />
      </div>
      <div class="ml-1 ns title">
        EXCHANGE
      </div>
    </div>
  </header>
</template>

<style scoped>
header {
  height: calc(var(--spacer) * 3);
}
.title {
  color: var(--accent);
  font-size: calc(var(--spacer) * 1.25);
  font-weight: 300;
}
</style>
