import { reactive } from 'vue';

import {
  DEFAULT_SERVER_CONFIGURATION,
  PALETTE_LIGHT,
} from '../configuration';
import type {
  DownloadedItem,
  DownloadFileError,
  ListedFile,
  Palette,
  ServerConfiguration,
  Theme,
} from '../types';
import isMobile from '../utilities/is-mobile';
import isStandalone from '../utilities/is-standalone';

const store= reactive<{
  autoSaveDownloadedFiles: boolean;
  connected: boolean;
  deviceName: string;
  downloadFileError: DownloadFileError | null;
  downloads: DownloadedItem[];
  isLocalServer: boolean;
  isMobile: boolean;
  isStandalone: boolean;
  listedFiles: ListedFile[];
  localServerAddress: string;
  palette: Palette;
  receivedConfiguration: boolean;
  serverConfiguration: ServerConfiguration;
  theme: Theme;
}>({
  autoSaveDownloadedFiles: true,
  connected: false,
  deviceName: '',
  downloadFileError: null,
  downloads: [],
  isLocalServer: false,
  isMobile: isMobile(),
  isStandalone: isStandalone(),
  listedFiles: [],
  localServerAddress: '',
  palette: PALETTE_LIGHT,
  receivedConfiguration: false,
  serverConfiguration: DEFAULT_SERVER_CONFIGURATION,
  theme: 'light',
});

export default store;
