export type BackendStatus = 'connected' | 'connecting' | 'inaccessible';

export interface AcknowledgementMessage<T = null> {
  data?: T;
  info: string;
  status: number;
}

export interface GenericFileData {
  fileId: string;
  ownerId: string;
}

export interface ChunkData extends GenericFileData {
  chunk: ArrayBuffer;
  currentChunk: number;
  fileName: string;
  fileSize: string;
  targetId: string;
  totalChunks: number;
  type: string;
}

export type ChunkRequest = Pick<ChunkData, 'fileId' | 'ownerId' | 'targetId'> & {
  chunkIndex: number;
};

export interface DownloadedItem extends GenericFileData {
  chunks: ArrayBuffer[];
  downloadCompleted: boolean;
  fileName: string;
  fileSize: string;
  totalChunks: number;
  type: string;
}

export interface DownloadFileError {
  errorText: string;
  file: ListedFile;
}

export interface ListedFile {
  chunks: ArrayBuffer[];
  createdAt: number;
  deviceName: string;
  downloadCompleted: boolean;
  downloadPercent: number;
  fileLastModified: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  grant: string;
  id: string;
  isDownloading: boolean;
  isOwner: boolean;
  isRequestedDownload: boolean;
  isSavedOnDisk: boolean;
  ownerId: string;
  totalDownloads: number;
  withPassword: boolean;
}

export interface Palette {
  accent: string;
  accentLight: string;
  background: string;
  error: string;
  errorLight: string;
  muted: string;
  mutedDark: string;
  mutedLight: string;
  mutedSuperLight: string;
  success: string;
  successLight: string;
  text: string;
}

export interface ServerConfiguration {
  chunkSizeBytes: number;
  maxFileSizeBytes: number;
}

export type Theme = 'light' | 'dark';

export interface UpdateDeviceName {
  newDeviceName: string;
  ownerId: string;
}

export type UpdateTotalDownloads = Pick<GenericFileData, 'fileId'> & {
  totalDownloads: number;
};
