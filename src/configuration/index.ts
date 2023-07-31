export const COLORS = {
  accent: '#1e7878',
  accentLight: '#53acac',
}

export const EVENTS = {
  close: 'close',
  connect: 'connect',
  disconnect: 'disconnect',
  downloadFile: 'download-file',
  downloadFileError: 'download-file-error',
  listFile: 'list-file',
  requestFileChunk: 'request-file-chunk',
  requestListedFiles: 'request-listed-files',
  uploadFileChunk: 'upload-file-chunk',
};

export const MESSAGES = {
  fileNotFound: 'FILE_NOT_FOUND',
};

export const SPACER = 16;

export const WS_URL = import.meta.env.VITE_WS_URL;
