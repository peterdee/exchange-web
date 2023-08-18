<script setup lang="ts">
import { ref } from 'vue';

import { COLORS } from '../../configuration';

const props = defineProps({
  emptyColor: {
    default: COLORS.mutedSuperLight,
    required: false,
    type: String,
  },
  fillColor: {
    default: COLORS.accent,
    required: false,
    type: String,
  },
  percent: {
    required: true,
    type: Number,
  },
});

const background = ref(`
  radial-gradient(closest-side, white 60%, transparent 60% 100%),
  conic-gradient(${props.fillColor} ${props.percent}%, ${props.emptyColor} 0)
`);
</script>

<template>
  <div
    class="progress-bar"
  >
    <progress
      max="100"
      min="0"
      :value="props.percent"
    >
      {{ `${props.percent}%` }}
    </progress>
  </div>
</template>

<style scoped>
progress {
  height: 0;
  visibility: hidden;
  width: 0;
}
.progress-bar {
  background: v-bind(background);
  border-radius: 50%; 
  height: calc(var(--spacer) * 1.75);
  width: calc(var(--spacer) * 1.75);
}
</style>
