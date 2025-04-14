import { reactive } from 'vue';

import { DEFAULT_SERVER_CONFIGURATION } from '../configuration';
import type {
  DownloadedItem,
  DownloadFileError,
  ListedFile,
  ServerConfiguration,
} from '../types';
import isMobile from '../utilities/is-mobile';

const store= reactive<{
  autoSaveDownloadedFiles: boolean;
  connected: boolean;
  deviceName: string;
  downloadFileError: DownloadFileError | null;
  downloads: DownloadedItem[];
  isMobile: boolean;
  listedFiles: ListedFile[];
  receivedConfiguration: boolean;
  serverConfiguration: ServerConfiguration;
}>({
  autoSaveDownloadedFiles: true,
  connected: false,
  deviceName: '',
  downloadFileError: null,
  downloads: [],
  isMobile: isMobile(),
  listedFiles: [],
  receivedConfiguration: false,
  serverConfiguration: DEFAULT_SERVER_CONFIGURATION,
});

export default store;
