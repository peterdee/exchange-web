<script setup lang="ts">
import { COLORS, SPACER } from '../configuration';

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
      d="M9.87871 14.1213L12 12M14.1213 9.87868L12 12M12 12L9.87871 9.87868M12 12L14.1213 14.1213"
      stroke-width="1.5"
      :stroke="props.color"
    />
    <path
      d="M21 3.6V20.4C21 20.7314 20.7314 21 20.4 21H3.6C3.26863 21 3 20.7314 3 20.4V3.6C3 3.26863 3.26863 3 3.6 3H20.4C20.7314 3 21 3.26863 21 3.6Z"
      stroke-width="2.5"
      :stroke="props.color"
    />
  </svg>
</template>
