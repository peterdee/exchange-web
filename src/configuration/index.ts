export const CHUNK_SIZE = 1024 * 128;

export const COLORS = {
  accent: '#1e7878',
  accentLight: '#53acac',
  error: '#ee3020',
  muted: '#999999', 
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
  downloadFileError: 'download-file-error',
  listFile: 'list-file',
  removePassword: 'remove-password',
  requestFileChunk: 'request-file-chunk',
  requestListedFiles: 'request-listed-files',
  updateDeviceName: 'update-device-name',
  updateFilePrivacy: 'update-file-privacy',
  uploadFileChunk: 'upload-file-chunk',
};

export const MESSAGES = {
  fileNotFound: 'FILE_NOT_FOUND',
};

export const SPACER = 16;

export const SUPPORTS_FS_ACCESS_API = 'getAsFileSystemHandle'
  in DataTransferItem.prototype;

export const SUPPORTS_WEBKIT_GET_AS_ENTRY = 'webkitGetAsEntry'
  in DataTransferItem.prototype;

export const WS_URL = import.meta.env.VITE_WS_URL;
