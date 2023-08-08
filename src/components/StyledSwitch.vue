<script setup lang="ts">
const emit = defineEmits(['toggle-switch']);

const props = defineProps<{
  disabled: boolean;
  isChecked: boolean;
  label: string;
  name: string;
}>();
</script>

<template>
  <div class="f ai-center j-space-between ns">
    <label
      class="switch-label"
      :for="`switch-${name}`"
    >
      {{ props.label }}
    </label>
    <label class="switch">
      <input
        type="checkbox"
        :checked="props.isChecked"
        :disabled="props.disabled"
        :id="`switch-${name}`"
        @input="emit('toggle-switch')"
      >
      <span class="slider round"></span>
    </label>
  </div>
</template>

<style scoped>
.switch {
  display: inline-block;
  height: calc(var(--spacer) + var(--spacer-half));
  position: relative;
  width: calc(var(--spacer) * 3);
}
.switch input {
  height: 0;
  opacity: 0;
  width: 0;
}
.switch-label {
  cursor: pointer;
}
.slider {
  background-color: var(--muted-light);
  bottom: 0;
  cursor: pointer;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  transition: var(--transition);
  -webkit-transition: var(--transition);
}
.slider:before {
  background-color: var(--background);
  bottom: var(--spacer-quarter);
  content: "";
  height: var(--spacer);
  left: var(--spacer-quarter);
  position: absolute;
  transition: var(--transition);
  -webkit-transition: var(--transition);
  width: var(--spacer);
}
input:checked + .slider {
  background-color: var(--accent);
}
input:focus + .slider {
  box-shadow: 0 0 1px var(--accent);
}
input:checked + .slider:before {
  -ms-transform: translateX(calc(var(--spacer) + var(--spacer-half)));
  -webkit-transform: translateX(calc(var(--spacer) + var(--spacer-half)));
  transform: translateX(calc(var(--spacer) + var(--spacer-half)));
}
.slider.round {
  border-radius: calc(var(--spacer));
}
.slider.round:before {
  border-radius: 50%;
}
</style>
