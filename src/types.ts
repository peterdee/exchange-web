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
  ownerId: string;
  totalDownloads: number;
  withPassword: boolean;
}

export interface UpdateDeviceName {
  newDeviceName: string;
  ownerId: string;
}

export type UpdateTotalDownloads = Pick<GenericFileData, 'fileId'> & {
  totalDownloads: number;
};
