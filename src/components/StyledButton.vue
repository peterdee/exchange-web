<script setup lang="ts">
const emit = defineEmits(['handle-click']);

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
  isNegative: {
    default: false,
    required: false,
    type: Boolean,
  },
  title: {
    default: '',
    required: false,
    type: String,
  },
  type: {
    default: 'button',
    required: false,
    type: String,
  },
  withIcon: {
    default: false,
    required: false,
    type: Boolean,
  },
});

const additionalClasses = props.globalClasses.length > 0
  ? props.globalClasses.join(' ')
  : '';
</script>

<template>
  <button
    :class="`button ns styled-button ${props.isNegative && !props.disabled
      ? 'negative'
      : ''} ${props.withIcon
      ? 'icon-button'
      : ''} ${additionalClasses}`"
    :disabled="props.disabled"
    :style="{ ...customStyles }"
    :title="props.title"
    :type="props.type === 'button'
      ? 'button'
      : 'submit'"
    @click="emit('handle-click')"
  >
    <slot></slot>
  </button>
</template>

<style scoped>
.icon-button {
  background-color: transparent;
  opacity: .6;
  padding: 0;
  transition: opacity var(--transition) ease-out;
}
.icon-button:hover {
  opacity: 1;
  transition: opacity var(--transition) ease-in;
}
.icon-button:disabled {
  opacity: .6;
  transition: opacity var(--transition) ease-in;
}
.negative {
  background-color: var(--error);
}
.negative:hover {
  background-color: var(--error-light);
}
.styled-button {
  font-size: var(--spacer);
  height: calc(var(--spacer) * 2.5);
}
</style>
