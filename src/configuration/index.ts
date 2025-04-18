import type { ServerConfiguration } from '../types';

export const COLORS = {
  accent: '#1e7878',
  accentLight: '#53acac',
  error: '#aa2111',
  muted: '#999999',
  mutedLight: '#bbbbbb',
  mutedSuperLight: '#dfdfdf',
  positive: '#60be60',
};

export const DEFAULT_SERVER_CONFIGURATION: ServerConfiguration = {
  chunkSizeBytes: 122880, // 120 KB
  maxFileSizeBytes: 104857600, // 100 MB
};

export const EVENTS = {
  changePassword: 'change-password',
  clientDisconnect: 'client-disconnect',
  close: 'close',
  connect: 'connect',
  deleteAllFiles: 'delete-all-files',
  deleteFile: 'delete-file',
  disconnect: 'disconnect',
  downloadFile: 'download-file',
  listFile: 'list-file',
  removePassword: 'remove-password',
  requestFileChunk: 'request-file-chunk',
  requestGrant: 'request-grant',
  requestListedFiles: 'request-listed-files',
  requestServerConfiguration: 'request-server-configuration',
  updateDeviceName: 'update-device-name',
  updateFilePrivacy: 'update-file-privacy',
  updateTotalDownloads: 'update-total-downloads',
  uploadFileChunk: 'upload-file-chunk',
};

export const MESSAGES = {
  fileNotFound: 'FILE_NOT_FOUND',
  fileOwnerDisconnected: 'FILE_OWNER_DISCONNECTED',
  invalidData: 'INVALID_DATA',
  invalidPassword: 'INVALID_PASSWORD',
  missingRequiredData: 'MISSING_REQUIRED_DATA',
};

export const SPACER = 16;

export const SUPPORTS_FS_ACCESS_API = 'getAsFileSystemHandle'
  in DataTransferItem.prototype;

export const SUPPORTS_WEBKIT_GET_AS_ENTRY = 'webkitGetAsEntry'
  in DataTransferItem.prototype;

export const WS_URL = import.meta.env.VITE_WS_URL;
