<script setup lang="ts">
const props = defineProps({
  customStyles: {
    default: {},
    required: false,
    type: Object,
  },
  disabled: {
    default: false,
    required: false,
    type: Boolean,
  },
  globalClasses: {
    default: [],
    required: false,
    type: Array<string>,
  },
  type: {
    default: 'button',
    required: false,
    type: String,
  },
});

const additionalClasses = props.globalClasses.length > 0
  ? props.globalClasses.join(' ')
  : '';
</script>

<template>
  <button
    :class="`button ns styled-button ${additionalClasses}`"
    :disabled="props.disabled"
    :styles="props.customStyles"
    :type="props.type === 'button'
      ? 'button'
      : 'submit'"
  >
    <slot></slot>
  </button>
</template>

<style scoped>
.styled-button {
  font-size: var(--spacer);
  height: calc(var(--spacer) * 2.5);
}
</style>
