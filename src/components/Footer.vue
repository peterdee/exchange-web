<script setup lang="ts">
import type { BackendStatus } from '../types';

const props = defineProps<{
  backendStatus: BackendStatus;
  isMobile: boolean;
}>();

const statusClass = props.backendStatus === 'connected'
  ? 'ok'
  : props.backendStatus === 'connecting'
    ? 'loading'
    : 'error';

const statusTitle = statusClass === 'ok'
  ? 'Connected to the backend'
  : statusClass === 'error'
    ? 'Backend is inaccessible'
    : 'Connecting...';

const year = new Date().getFullYear();
</script>

<template>
  <footer
    :class="`f f-wrap ai-center j-center ns ${props.isMobile
      ? 'mh-1'
      : 'mh-2'}`"
  >
    <span>
      © {{ year }}
    </span>
    <span class="ml-1">
      <a
        href="https://github.com/peterdee/exchange-web"
        target="_blank"
      >
        EXCHANGE
      </a>
    </span>
    <span class="ml-1">
      <a
        href="https://dyum.in"
        target="_blank"
      >
        Peter Dyumin
      </a>
    </span>
    <span class="ml-1">
      Backend status
    </span>
    <div
      :class="`ml-half status ${statusClass}`"
      :title="statusTitle"
    />
  </footer>
</template>

<style scoped>
footer {
  font-size: calc(var(--spacer) * .75);
  height: calc(var(--spacer) * 3);
}
.error, .loading, .ok {
  transition: background-color var(--transition) ease;
}
.error {
  background-color: var(--error);
}
.loading {
  background-color: var(--muted-light);
}
.ok {
  background-color: var(--success);
}
.status {
  border-radius: 50%;
  height: calc(var(--spacer) * .75);
  width: calc(var(--spacer) * .75);
  transition: opacity var(--transition) ease-out;
}
.status:hover {
  cursor: pointer;
  opacity: .6;
  transition: opacity var(--transition) ease-in;
}
</style>
