<script setup lang="ts">
import { COLORS, SPACER } from '../../configuration';

const props = defineProps({
  color: {
    default: COLORS.accent,
    required: false,
    type: String,
  },
  size: {
    default: SPACER * 2,
    required: false,
    type: Number,
  },
});
</script>

<template>
  <svg
    fill="none"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    :height="`${props.size}px`"
    :width="`${props.size}px`"
  >
    <path
      d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z"
      stroke-width="1.5"
      :stroke="props.color"
    />
    <path
      d="M14.5 9.50002L9.5 14.5M9.49998 9.5L14.5 14.5"
      stroke-linecap="round"
      stroke-width="1.5"
      :stroke="props.color"
    />
  </svg>
</template>
