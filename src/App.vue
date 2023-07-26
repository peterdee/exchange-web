<script setup lang="ts">
import { io, type Socket } from 'socket.io-client';
import { onMounted, reactive } from 'vue';

import { EVENTS } from './configuration';

interface AppState {
  connected: boolean;
  connection: Socket;
}

const state = reactive<AppState>({
  connected: false,
  connection: {} as Socket,
});

const handleListFile = (): void => {
  state.connection.emit('list-file', { name: 'file', size: 1, isPrivate: true });
}

onMounted((): void => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    const faviconLink = document.querySelector<HTMLLinkElement>(`link[rel~='${'icon'}']`);
    if (faviconLink) {
      faviconLink.href = 'favicon-light.svg';
    }
  }
  
  const connection = io(
    'ws://localhost:9090',
    {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    },
  );

  connection.on(
    EVENTS.connect,
    (): void => {
      state.connected = true;
      state.connection = connection;
    },
  );
});
</script>

<template>
  <div class="f ai-center j-center h-100vh">
    <h1>
      Connection state: {{ state.connected }}
    </h1>
    <button
      class="button"
      @click="handleListFile"
    >
      List file
    </button>
  </div>
</template>

<style scoped>

</style>
