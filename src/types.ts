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
  private: boolean;
  size: number;
}
