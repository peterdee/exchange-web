import { reactive } from 'vue';

import type { DownloadedItem, ListedFile } from '../types';
import isMobile from '../utilities/is-mobile';

const store= reactive<{
  connected: boolean;
  deviceName: string;
  downloads: DownloadedItem[];
  isMobile: boolean;
  listedFiles: ListedFile[];
}>({
  connected: false,
  deviceName: '',
  downloads: [],
  isMobile: isMobile(),
  listedFiles: [],
});

export default store;
