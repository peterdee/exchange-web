import { reactive } from 'vue';
import { io, type Socket } from 'socket.io-client';

import { WS_URL } from '../configuration';

const connection = io(
  WS_URL,
  {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  },
);

export default reactive<{ io: Socket }>({ io: connection });
