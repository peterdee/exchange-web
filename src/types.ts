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
  chunk: string;
  currentChunk: number;
  fileName: string;
  fileSize: string;
  targetId: string;
  totalChunks: number;
  type: string;
}

export type ChunkRequest = Pick<ChunkData, 'fileId' | 'ownerId' | 'targetId'> & {
  chunkIndex: number;
}

export interface DownloadedItem extends GenericFileData {
  chunks: string[];
  downloadCompleted: boolean;
  fileName: string;
  fileSize: string;
  totalChunks: number;
  type: string;
}

export interface ListedFile {
  chunks: string[];
  createdAt: number;
  deviceName: string;
  downloadCompleted: boolean;
  downloadPercent: number;
  file?: File;
  grant?: string;
  id: string;
  isDownloading: boolean;
  isOwner: boolean;
  name: string;
  ownerId: string;
  size: number;
  withPassword: boolean;
}

export interface UpdateDeviceName {
  newDeviceName: string;
  ownerId: string;
}
