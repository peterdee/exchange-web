<script setup lang="ts">
import store from '../../store';

const props = defineProps({
  fillColor: {
    default: store.palette.accent,
    required: false,
    type: String,
  },
  percent: {
    required: true,
    type: Number,
  },
});
</script>

<template>
  <div
    class="progress-bar"
    :style="{ background: `
      radial-gradient(closest-side, ${store.palette.background} 60%, transparent 60% 100%),
      conic-gradient(${props.fillColor} ${props.percent}%, ${store.theme === 'dark'
        ? store.palette.mutedDark : store.palette.mutedSuperLight} 0)
    `}"
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
  border-radius: 50%; 
  height: calc(var(--spacer) * 1.75);
  width: calc(var(--spacer) * 1.75);
}
</style>
