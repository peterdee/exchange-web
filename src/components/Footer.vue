<script setup lang="ts">
import LogoIconComponent from './icons/LogoIcon.vue';
import { SPACER } from '../configuration';
import store from '../store';

const year = new Date().getFullYear();
</script>

<template>
  <footer
    :class="`f f-wrap ai-center j-center ns ${store.isMobile
      ? 'mh-1'
      : 'mh-2'}`"
  >
    <LogoIconComponent
      :color="store.palette.accent"
      :size="store.isMobile ? SPACER * 1.25 : SPACER * 1.5"
    />
    <span class="mh-1">
      <a
        href="https://github.com/peterdee/exchange-web"
        target="_blank"
      >
        EXCHANGE
      </a>
    </span>
    <span class="mr-1">
      <a
        href="https://dyum.in"
        target="_blank"
      >
        Peter Dyumin
      </a>
    </span>
    <span>
      © {{ year }}
    </span>
  </footer>
</template>

<style scoped>
footer {
  font-size: calc(var(--spacer) * .75);
  height: calc(var(--spacer) * 3);
}
</style>
