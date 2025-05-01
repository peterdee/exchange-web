<script setup lang="ts">
const emit = defineEmits(['handle-switch']);

const props = defineProps({
  checked: {
    default: false,
    required: true,
    type: Boolean,
  },
  customStyles: {
    default: {},
    required: false,
    type: Object,
  },
  globalClasses: {
    default: [],
    required: false,
    type: Array<string>,
  },
  id: {
    required: true,
    type: String,
  },
  labelText: {
    default: '',
    required: true,
    type: String,
  },
});

const additionalClasses = props.globalClasses.length > 0
  ? props.globalClasses.join(' ')
  : '';
</script>

<template>
  <div :class="`f ai-center ns ${additionalClasses}`">
    <input
      type="checkbox"
      :checked="checked"
      :id="`${props.id}-switch`"
      @input="emit('handle-switch')"
    />
    <label :for="`${props.id}-switch`">Toggle</label>
    <span
      class="ml-1 ns"
      @click="emit('handle-switch')"
    >
      {{ labelText }}
    </span>
  </div>
</template>

<style scoped>
input[type=checkbox]{
  height: 0;
  width: 0;
  visibility: hidden;
}
label {
  cursor: pointer;
  text-indent: -9999px;
  width: calc(var(--spacer) * 3);
  height: calc(var(--spacer) * 1.5);
  background: var(--muted-light);
  display: block;
  border-radius: calc(var(--spacer) * 1.5);
  position: relative;
}
label:after {
  content: '';
  position: absolute;
  top: calc(var(--spacer-quarter) / 2);
  left: calc(var(--spacer-quarter) / 2);
  width: calc(var(--spacer) + var(--spacer-quarter));
  height: calc(var(--spacer) + var(--spacer-quarter));
  background: var(--background);
  border-radius: calc(var(--spacer) + var(--spacer-quarter));;
  transition: var(--transition);
}
input:checked + label {
  background: var(--accent);
}
input:checked + label:after {
  left: calc(100% - var(--spacer-quarter) / 2);
  transform: translateX(-100%);
}
label:active:after {
  width: calc(var(--spacer) + var(--spacer-quarter));
}
</style>
