import { reactive } from 'vue';

import type {
  DownloadedItem,
  DownloadFileError,
  ListedFile,
} from '../types';
import isMobile from '../utilities/is-mobile';

const store= reactive<{
  connected: boolean;
  deviceName: string;
  downloadFileError: DownloadFileError | null;
  downloads: DownloadedItem[];
  isMobile: boolean;
  listedFiles: ListedFile[];
}>({
  connected: false,
  deviceName: '',
  downloadFileError: null,
  downloads: [],
  isMobile: isMobile(),
  listedFiles: [],
});

export default store;
