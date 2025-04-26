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
  isLocalServer: boolean;
  isMobile: boolean;
  listedFiles: ListedFile[];
  localServerAddress: string;
  receivedConfiguration: boolean;
  serverConfiguration: ServerConfiguration;
}>({
  autoSaveDownloadedFiles: true,
  connected: false,
  deviceName: '',
  downloadFileError: null,
  downloads: [],
  isLocalServer: false,
  isMobile: isMobile(),
  listedFiles: [],
  localServerAddress: '',
  receivedConfiguration: false,
  serverConfiguration: DEFAULT_SERVER_CONFIGURATION,
});

export default store;
