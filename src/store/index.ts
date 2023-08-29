import { io, type Socket } from 'socket.io-client';
import { reactive } from 'vue';

import type {
  ChunkData,
  ChunkRequest,
  DownloadedItem,
  GenericFileData,
  ListedFile,
  UpdateDeviceName,
  UpdateTotalDownloads,
} from '../types';
import { convertArrayBufferChunksToBlob } from '../utilities/binary';
import { EVENTS } from '../configuration';
import saveFileOnDisk from '../utilities/save-file-on-disk';
import { WS_URL } from '../configuration';

const connection = io(
  WS_URL,
  {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  },
);

const state = reactive<{
  connected: boolean;
  downloads: DownloadedItem[];
  io: Socket;
  listedFiles: ListedFile[];
}>({
  connected: false,
  downloads: [],
  io: connection,
  listedFiles: [],
});

const ioHandlerChangePassword = (data: GenericFileData): void => {
  const { fileId = '', ownerId = '' } = data;
  state.listedFiles.forEach((item: ListedFile): void => {
    if (item.id === fileId && item.ownerId === ownerId) {
      item.withPassword = true;
    }
  });
};

const ioHandlerClientDisconnect = ({ id }: { id: string }): void => {
  state.listedFiles = state.listedFiles.filter(
    (entry: ListedFile): boolean => entry.ownerId !== id,
  );
};

const ioHandlerDeleteAllFiles = ({ ownerId = '' }: { ownerId: string }): void => {
  state.listedFiles = state.listedFiles.filter(
    (item: ListedFile): boolean => item.ownerId !== ownerId,
  );
};

const ioHandlerDeleteFile = ({ fileId = '' }: { fileId: string }): void => {
  state.listedFiles = state.listedFiles.filter(
    (item: ListedFile): boolean => item.id !== fileId,
  );
};

const ioHandlerDownloadFile = (
  data: { fileId: string; targetId: string },
): null | Socket => {
  const { fileId = '', targetId = '' } = data;
  const [file] = state.listedFiles.filter(
    (item: ListedFile): boolean => item.id === fileId && item.isOwner,
  );
  if (!file) {
    return null;
  }
  return connection.emit(
    EVENTS.uploadFileChunk,
    {
      chunk: file.chunks[0],
      currentChunk: 1,
      fileId,
      fileName: file.fileName,
      fileSize: file.fileSize,
      ownerId: file.ownerId,
      targetId,
      totalChunks: file.chunks.length,
      type: file.fileType,
    },
  );
};

const ioHandlerListFile = (data: ListedFile): void => {
  state.listedFiles.push({
    ...data,
    downloadCompleted: false,
    downloadPercent: 0,
    grant: '',
    isDownloading: false,
    isOwner: false,
  });
};

const ioHandlerRemoveFilePassword = (data: GenericFileData): void => {
  const { fileId = '', ownerId = '' } = data;
  state.listedFiles.forEach((item: ListedFile): void => {
    if (item.id === fileId && item.ownerId === ownerId) {
      item.withPassword = false;
    }
  });
};

const ioHandlerRequestFileChunk = (data: ChunkRequest): null | Socket => {
  const {
    chunkIndex,
    fileId,
    targetId,
  } = data;
  const [file = null] = state.listedFiles.filter(
    (item: ListedFile): boolean => item.id === fileId,
  );
  if (!file) {
    return null;
  }
  return connection.emit(
    EVENTS.uploadFileChunk,
    {
      chunk: file.chunks[chunkIndex - 1],
      currentChunk: chunkIndex,
      fileId,
      fileName: file.fileName,
      fileSize: file.fileSize,
      ownerId: file.ownerId,
      targetId,
      totalChunks: file.chunks.length,
      type: file.fileType,
    },
  );
};

const ioHandlerRequestListedFiles = (data: ListedFile[]): void => {
  if (Array.isArray(data) && data.length > 0) {
    data.forEach((item: ListedFile): void => {
      state.listedFiles.push({
        ...item,
        downloadCompleted: false,
        downloadPercent: 0,
        grant: '',
        isDownloading: false,
        isOwner: false,
      });
    });
  }
};

const ioHandlerUpdateDeviceName = (data: UpdateDeviceName): void => {
  const { newDeviceName = '', ownerId = '' } = data;
  state.listedFiles.forEach((item: ListedFile): void => {
    if (item.ownerId === ownerId) {
      item.deviceName = newDeviceName;
    }
  });
};

const ioHandlerUpdateTotalDownloads = (data: UpdateTotalDownloads): void => {
  const { fileId = '', totalDownloads = 0 } = data;
  state.listedFiles.forEach((item: ListedFile): void => {
    if (item.id === fileId) {
      item.totalDownloads = totalDownloads;
    }
  });
};

const ioHandlerUploadFileChunk = (data: ChunkData): Socket | void => {
  const {
    chunk,
    currentChunk,
    fileId,
    fileName,
    fileSize,
    ownerId,
    targetId,
    totalChunks,
    type,
  } = data;
  if (currentChunk === 1 && totalChunks === 1) {
    state.listedFiles.forEach((item: ListedFile): void => {
      if (item.id === fileId) {
        item.downloadCompleted = true;
        item.downloadPercent = 100
        item.isDownloading = false;
      }
    });
    return saveFileOnDisk(
      convertArrayBufferChunksToBlob([chunk], type),
      fileName,
    );
  }
  if (currentChunk === 1 && totalChunks > 1) {
    state.listedFiles.forEach((item: ListedFile): void => {
      if (item.id === fileId) {
        item.downloadCompleted = false;
        item.downloadPercent = Math.round(currentChunk / (totalChunks / 100));
        item.isDownloading = true;
      }
    });
    const newEntry: DownloadedItem = {
      chunks: [chunk],
      downloadCompleted: currentChunk === totalChunks,
      fileId,
      fileName,
      fileSize,
      ownerId,
      totalChunks,
      type,
    };
    state.downloads.push(newEntry);
    return connection.emit(
      EVENTS.requestFileChunk,
      {
        chunkIndex: currentChunk + 1,
        fileId,
        ownerId,
        targetId,
      },
    );
  }
  if (currentChunk > 1 && currentChunk < totalChunks) {
    state.downloads.forEach((item: DownloadedItem): void => {
      if (item.fileId === fileId) {
        item.chunks.push(chunk);
      }
    });
    state.listedFiles.forEach((item: ListedFile): void => {
      if (item.id === fileId) {
        item.downloadPercent = Math.round(currentChunk / (totalChunks / 100));
      }
    });
    return connection.emit(
      EVENTS.requestFileChunk,
      {
        chunkIndex: currentChunk + 1,
        fileId,
        ownerId,
        targetId,
      },
    );
  }
  if (currentChunk === totalChunks) {
    const [downloadedFile] = state.downloads.filter(
      (item: DownloadedItem): boolean => item.fileId === fileId,
    );
    state.listedFiles.forEach((item: ListedFile): void => {
      if (item.id === fileId) {
        item.downloadCompleted = true;
        item.downloadPercent = 100;
        item.isDownloading = false;
      }
    });
    downloadedFile.chunks.push(chunk);
    saveFileOnDisk(
      convertArrayBufferChunksToBlob(downloadedFile.chunks, downloadedFile.type),
      downloadedFile.fileName,
    );
    state.downloads = state.downloads.filter(
      (item: DownloadedItem): boolean => item.fileId !== fileId,
    );
  }
};

connection.on(
  EVENTS.connect,
  (): void => {
    connection.on(EVENTS.changePassword, ioHandlerChangePassword);
    connection.on(EVENTS.clientDisconnect, ioHandlerClientDisconnect);
    connection.on(EVENTS.deleteAllFiles, ioHandlerDeleteAllFiles);
    connection.on(EVENTS.deleteFile, ioHandlerDeleteFile);
    connection.on(EVENTS.downloadFile, ioHandlerDownloadFile);
    connection.on(EVENTS.listFile, ioHandlerListFile);
    connection.on(EVENTS.removePassword, ioHandlerRemoveFilePassword);
    connection.on(EVENTS.requestFileChunk, ioHandlerRequestFileChunk);
    connection.on(EVENTS.requestListedFiles, ioHandlerRequestListedFiles);
    connection.on(EVENTS.updateDeviceName, ioHandlerUpdateDeviceName);
    connection.on(EVENTS.updateTotalDownloads, ioHandlerUpdateTotalDownloads);
    connection.on(EVENTS.uploadFileChunk, ioHandlerUploadFileChunk);
    
    connection.emit(EVENTS.requestListedFiles);

    state.connected = true;
    state.io = connection;
  },
);

export const handleDisconnect = (): void => {
  if (state.connected) {
    state.io.off(EVENTS.changePassword, ioHandlerChangePassword);
    state.io.off(EVENTS.clientDisconnect, ioHandlerClientDisconnect);
    state.io.off(EVENTS.deleteAllFiles, ioHandlerDeleteAllFiles);
    state.io.off(EVENTS.deleteFile, ioHandlerDeleteFile);
    state.io.off(EVENTS.downloadFile, ioHandlerDownloadFile);
    state.io.off(EVENTS.listFile, ioHandlerListFile);
    state.io.off(EVENTS.removePassword, ioHandlerRemoveFilePassword);
    state.io.off(EVENTS.requestFileChunk, ioHandlerRequestFileChunk);
    state.io.off(EVENTS.requestListedFiles, ioHandlerRequestListedFiles);
    state.io.off(EVENTS.updateDeviceName, ioHandlerUpdateDeviceName);
    state.io.off(EVENTS.updateTotalDownloads, ioHandlerUpdateTotalDownloads);
    state.io.off(EVENTS.uploadFileChunk, ioHandlerUploadFileChunk);

    state.io.emit(EVENTS.close);

    state.connected = false;
  }
};

export default state;
