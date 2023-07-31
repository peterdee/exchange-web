<script setup lang="ts">
const emit = defineEmits(['handle-input']);

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
  name: {
    required: true,
    type: String,
  },
  globalClasses: {
    default: [],
    required: false,
    type: Array<string>,
  },
  placeholder: {
    default: '',
    required: false,
    type: String,
  },
  type: {
    default: 'text',
    required: false,
    type: String,
  },
  value: {
    required: true,
    type: String,
  },
});

const additionalClasses = props.globalClasses.length > 0
  ? props.globalClasses.join(' ')
  : '';

const handleInput = (event: Event): void => {
  const { name = '', value = '' } = event.target as HTMLInputElement;
  return emit(
    'handle-input',
    {
      name,
      value,
    },
  );
}
</script>

<template>
  <input
    :class="`input styled-input ${additionalClasses}`"
    :disabled="props.disabled"
    :name="props.name"
    :placeholder="props.placeholder"
    :style="{ ...customStyles }"
    :type="props.type"
    :value="props.value"
    @input="handleInput"
  />
</template>

<style scoped>
.styled-input {
  font-size: var(--spacer);
  height: calc(var(--spacer) * 2.5);
}
</style>
