export type BackendStatus = 'connected' | 'connecting' | 'inaccessible';

export interface AcknowledgementMessage<T = null> {
  data?: T;
  info: string;
  status: number;
}

export interface ChunkData {
  chunk: string;
  currentChunk: number;
  fileId: string;
  fileName: string;
  fileSize: string;
  ownerId: string;
  targetId: string;
  totalChunks: number;
  type: string;
}

export type ChunkRequest = Pick<ChunkData, 'fileId' | 'ownerId' | 'targetId'> & {
  chunkIndex: number;
}

export interface DownloadedItem {
  chunks: string[];
  downloadCompleted: boolean;
  fileId: string;
  fileName: string;
  fileSize: string;
  ownerId: string;
  totalChunks: number;
  type: string;
}

export interface ListedFile {
  chunks: string[];
  createdAt: number;
  deviceName: string;
  file?: File;
  id: string;
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

export interface UpdateFilePrivacy {
  fileId: string;
  isPrivate: boolean;
  ownerId: string;
}
