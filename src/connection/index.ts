import { io, type Socket } from 'socket.io-client';

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
import getHash from '../utilities/get-hash';
import saveFileOnDisk from '../utilities/save-file-on-disk';
import store from '../store';
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

const ioHandlerChangePassword = (data: GenericFileData): void => {
  const { fileId = '', ownerId = '' } = data;
  store.listedFiles.forEach((item: ListedFile): void => {
    if (item.id === fileId && item.ownerId === ownerId) {
      item.withPassword = true;
    }
  });
};

const ioHandlerClientDisconnect = ({ id }: { id: string }): void => {
  store.listedFiles = store.listedFiles.filter(
    (entry: ListedFile): boolean => entry.ownerId !== id,
  );
};

const ioHandlerDeleteAllFiles = ({ ownerId = '' }: { ownerId: string }): void => {
  store.listedFiles = store.listedFiles.filter(
    (item: ListedFile): boolean => item.ownerId !== ownerId,
  );
};

const ioHandlerDeleteFile = ({ fileId = '' }: { fileId: string }): void => {
  store.listedFiles = store.listedFiles.filter(
    (item: ListedFile): boolean => item.id !== fileId,
  );
};

const ioHandlerDownloadFile = (
  data: { fileId: string; targetId: string },
): null | Socket => {
  const { fileId = '', targetId = '' } = data;
  const [file] = store.listedFiles.filter(
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
  store.listedFiles.push({
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
  store.listedFiles.forEach((item: ListedFile): void => {
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
  const [file = null] = store.listedFiles.filter(
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
      store.listedFiles.push({
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
  store.listedFiles.forEach((item: ListedFile): void => {
    if (item.ownerId === ownerId) {
      item.deviceName = newDeviceName;
    }
  });
};

const ioHandlerUpdateTotalDownloads = (data: UpdateTotalDownloads): void => {
  const { fileId = '', totalDownloads = 0 } = data;
  store.listedFiles.forEach((item: ListedFile): void => {
    if (item.id === fileId) {
      item.totalDownloads = totalDownloads;
    }
  });
};

const ioHandlerUploadFileChunk = async (
  data: ChunkData,
): Promise<null | Socket | void> => {
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
    const resultHash = await getHash(
      convertArrayBufferChunksToBlob([chunk], type),
    );
    if (resultHash !== fileId) {
      store.downloads = store.downloads.filter(
        (item: DownloadedItem): boolean => item.fileId !== fileId,
      );
      store.listedFiles.forEach((item: ListedFile): void => {
        if (item.id === fileId) {
          item.downloadCompleted = false;
          item.downloadPercent = 0;
          item.isDownloading = false;
          store.downloadFileError = {
            errorText: 'Downloaded file differs from the original file!',
            file: item,
          };
        }
      });
      return null;
    }
    store.listedFiles.forEach((item: ListedFile): void => {
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
    store.listedFiles.forEach((item: ListedFile): void => {
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
    store.downloads.push(newEntry);
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
    store.downloads.forEach((item: DownloadedItem): void => {
      if (item.fileId === fileId) {
        item.chunks.push(chunk);
      }
    });
    store.listedFiles.forEach((item: ListedFile): void => {
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
    const [downloadedFile] = store.downloads.filter(
      (item: DownloadedItem): boolean => item.fileId === fileId,
    );
    downloadedFile.chunks.push(chunk);
    const resultHash = await getHash(
      convertArrayBufferChunksToBlob(downloadedFile.chunks, downloadedFile.type),
    );
    if (resultHash !== fileId) {
      store.downloads = store.downloads.filter(
        (item: DownloadedItem): boolean => item.fileId !== fileId,
      );
      store.listedFiles.forEach((item: ListedFile): void => {
        if (item.id === fileId) {
          item.downloadCompleted = false;
          item.downloadPercent = 0;
          item.isDownloading = false;
          store.downloadFileError = {
            errorText: 'Downloaded file differs from the original file!',
            file: item,
          };
        }
      });
      return null;
    }
    store.listedFiles.forEach((item: ListedFile): void => {
      if (item.id === fileId) {
        item.downloadCompleted = true;
        item.downloadPercent = 100;
        item.isDownloading = false;
      }
    });
    saveFileOnDisk(
      convertArrayBufferChunksToBlob(downloadedFile.chunks, downloadedFile.type),
      downloadedFile.fileName,
    );
    store.downloads = store.downloads.filter(
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

    store.connected = true;
  },
);

export const handleDisconnect = (): void => {
  if (connection.connected) {
    connection.emit(EVENTS.close);

    connection.off(EVENTS.changePassword, ioHandlerChangePassword);
    connection.off(EVENTS.clientDisconnect, ioHandlerClientDisconnect);
    connection.off(EVENTS.deleteAllFiles, ioHandlerDeleteAllFiles);
    connection.off(EVENTS.deleteFile, ioHandlerDeleteFile);
    connection.off(EVENTS.downloadFile, ioHandlerDownloadFile);
    connection.off(EVENTS.listFile, ioHandlerListFile);
    connection.off(EVENTS.removePassword, ioHandlerRemoveFilePassword);
    connection.off(EVENTS.requestFileChunk, ioHandlerRequestFileChunk);
    connection.off(EVENTS.requestListedFiles, ioHandlerRequestListedFiles);
    connection.off(EVENTS.updateDeviceName, ioHandlerUpdateDeviceName);
    connection.off(EVENTS.updateTotalDownloads, ioHandlerUpdateTotalDownloads);
    connection.off(EVENTS.uploadFileChunk, ioHandlerUploadFileChunk);

    store.connected = false;
  }
};

export default connection;
