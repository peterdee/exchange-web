export const CHUNK_SIZE = Number(import.meta.env.VITE_CHUNK_SIZE) || 1024 * 120;

export const COLORS = {
  accent: '#1e7878',
  accentLight: '#53acac',
  error: '#aa2111',
  muted: '#999999',
  mutedLight: '#bbbbbb',
  mutedSuperLight: '#dfdfdf',
  positive: '#60be60',
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
  updateDeviceName: 'update-device-name',
  updateFilePrivacy: 'update-file-privacy',
  updateTotalDownloads: 'update-total-downloads',
  uploadFileChunk: 'upload-file-chunk',
};

export const MAX_FILE_SIZE = Number(import.meta.env.VITE_MAX_FILE_SIZE) || 1024 * 1024 * 100;

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
