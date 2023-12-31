<script setup lang="ts">
import { reactive } from 'vue';

import { COLORS, SPACER } from '../../configuration';
import EyeClosedIconComponent from '../icons/EyeClosedIcon.vue';
import EyeOpenedIconComponent from '../icons/EyeOpenedIcon.vue';
import StyledButtonComponent from './StyledButton.vue';

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
  withError: {
    default: false,
    required: false,
    type: Boolean,
  },
});

const state = reactive<{ showPassword: boolean }>({
  showPassword: false,
});

const additionalClasses = props.globalClasses.length > 0
  ? props.globalClasses.join(' ')
  : '';

const getInputType = (): string => {
  return props.type !== 'password'
    ? props.type
    : state.showPassword && props.type === 'password'
      ? 'text'
      : props.type;
};

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

const togglePasswordVisibility = (): void => {
  state.showPassword = !state.showPassword;
}
</script>

<template>
  <div class="f ai-center">
    <input
      :class="`input w-100 styled-input ${additionalClasses} ${props.type === 'password'
        ? 'with-password'
        : ''} ${props.withError
        ? 'error-border'
        : ''}`"
      :disabled="props.disabled"
      :name="props.name"
      :placeholder="props.placeholder"
      :style="{ ...customStyles }"
      :type="getInputType()"
      :value="props.value"
      @input="handleInput"
    />
    <StyledButtonComponent
      v-if="props.type === 'password'"
      :custom-styles="{ height: `${SPACER * 2}px` }"
      :disabled="props.disabled || props.value.length === 0"
      :global-classes="['ml-half']"
      :title="state.showPassword ? 'Hide password' : 'Show password'"
      :with-icon="true"
      @handle-click="togglePasswordVisibility"
    >
      <EyeClosedIconComponent
        v-if="!state.showPassword"
        :color="props.disabled || props.value.length === 0
          ? COLORS.muted
          : COLORS.accent"
      />
      <EyeOpenedIconComponent
        v-if="state.showPassword"
        :color="props.disabled || props.value.length === 0
          ? COLORS.muted
          : COLORS.accent"
      />
    </StyledButtonComponent>
  </div>
</template>

<style scoped>
.styled-input {
  font-size: var(--spacer);
  height: calc(var(--spacer) * 2.5);
}
.error-border {
  border-color: var(--negative);
}
.with-password {
  width: calc(100% - var(--spacer) * 2.5);
}
</style>
