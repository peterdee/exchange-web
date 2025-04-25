import { io, type Socket } from 'socket.io-client';

import type {
  AcknowledgementMessage,
  ChunkData,
  ChunkRequest,
  DownloadedItem,
  GenericFileData,
  ListedFile,
  ServerConfiguration,
  UpdateDeviceName,
  UpdateTotalDownloads,
} from '../types';
import { convertArrayBufferChunksToBlob } from '../utilities/binary';
import { EVENTS } from '../configuration';
import getHash from '../utilities/get-hash';
import saveFileOnDisk from '../utilities/save-file-on-disk';
import store from '../store';
import { WS_URL } from '../configuration';

async function checkHashSum(
  chunks: ArrayBuffer[],
  fileType: string,
  fileId: string,
): Promise<boolean> {
  const resultHash = await getHash(
    convertArrayBufferChunksToBlob(chunks, fileType),
  );
  if (resultHash === fileId) {
    return true;
  }
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
  return false;
}

const connection = {
  io: io(
    WS_URL,
    {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    },
  ),
};

export const updateConnection = (url: string) => {
  connection.io = io(
    url,
    {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    },
  );
};

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
  return connection.io.emit(
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
  return connection.io.emit(
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
    const isHashValid = await checkHashSum([chunk], type, fileId);
    if (!isHashValid) {
      return null;
    }
    if (store.autoSaveDownloadedFiles) {
      store.listedFiles.forEach((item: ListedFile): void => {
        if (item.id === fileId) {
          item.downloadCompleted = true;
          item.downloadPercent = 0;
          item.isDownloading = false;
          item.isSavedOnDisk = true;
        }
      });
      return saveFileOnDisk(
        convertArrayBufferChunksToBlob([chunk], type),
        fileName,
      );
    } else {
      store.listedFiles.forEach((item: ListedFile): void => {
        if (item.id === fileId) {
          item.downloadCompleted = true;
          item.downloadPercent = 100;
          item.isDownloading = false;
          item.isSavedOnDisk = false;
        }
      });
      const newEntry: DownloadedItem = {
        chunks: [chunk],
        downloadCompleted: true,
        fileId,
        fileName,
        fileSize,
        ownerId,
        totalChunks,
        type,
      };
      store.downloads.push(newEntry);
    }
    return null;
  }
  if (currentChunk === 1 && totalChunks > 1) {
    store.listedFiles.forEach((item) => {
      if (item.id === fileId) {
        item.downloadCompleted = false;
        item.downloadPercent = Math.round(currentChunk / (totalChunks / 100));
        item.isDownloading = true;
        item.isSavedOnDisk = false;
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
    return connection.io.emit(
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
    store.downloads.forEach((item) => {
      if (item.fileId === fileId) {
        item.chunks.push(chunk);
      }
    });
    store.listedFiles.forEach((item) => {
      if (item.id === fileId && item.isDownloading) {
        item.downloadPercent = Math.round(currentChunk / (totalChunks / 100));
        connection.io.emit(
          EVENTS.requestFileChunk,
          {
            chunkIndex: currentChunk + 1,
            fileId,
            ownerId,
            targetId,
          },
        );
      }
    });
    return null;
  }
  if (currentChunk === totalChunks) {
    const [downloadedFile] = store.downloads.filter(
      (item: DownloadedItem): boolean => item.fileId === fileId,
    );
    downloadedFile.downloadCompleted = true;
    downloadedFile.chunks.push(chunk);
    const isHashValid = await checkHashSum(downloadedFile.chunks, type, fileId);
    if (!isHashValid) {
      return null;
    }
    store.listedFiles.forEach((item: ListedFile): void => {
      if (item.id === fileId) {
        item.downloadCompleted = true;
        item.downloadPercent = 100;
        item.isDownloading = false;
      }
    });
    if (store.autoSaveDownloadedFiles) {
      saveFileOnDisk(
        convertArrayBufferChunksToBlob(downloadedFile.chunks, downloadedFile.type),
        downloadedFile.fileName,
      );
      store.downloads = store.downloads.filter(
        (item: DownloadedItem): boolean => item.fileId !== fileId,
      );
      store.listedFiles.forEach((item: ListedFile): void => {
        if (item.id === fileId) {
          item.downloadPercent = 0;
          item.isSavedOnDisk = true;
        }
      });
    }
  }
};

export const registerEvents = () => {
  connection.io.on(
    EVENTS.connect,
    (): void => {
      connection.io.on(EVENTS.changePassword, ioHandlerChangePassword);
      connection.io.on(EVENTS.clientDisconnect, ioHandlerClientDisconnect);
      connection.io.on(EVENTS.deleteAllFiles, ioHandlerDeleteAllFiles);
      connection.io.on(EVENTS.deleteFile, ioHandlerDeleteFile);
      connection.io.on(EVENTS.downloadFile, ioHandlerDownloadFile);
      connection.io.on(EVENTS.listFile, ioHandlerListFile);
      connection.io.on(EVENTS.removePassword, ioHandlerRemoveFilePassword);
      connection.io.on(EVENTS.requestFileChunk, ioHandlerRequestFileChunk);
      connection.io.on(EVENTS.requestListedFiles, ioHandlerRequestListedFiles);
      connection.io.on(EVENTS.updateDeviceName, ioHandlerUpdateDeviceName);
      connection.io.on(EVENTS.updateTotalDownloads, ioHandlerUpdateTotalDownloads);
      connection.io.on(EVENTS.uploadFileChunk, ioHandlerUploadFileChunk);
      
      connection.io.emit(
        EVENTS.requestServerConfiguration,
        (response: AcknowledgementMessage<ServerConfiguration>) => {
          if (response.data) {
            store.connected = true;
            store.receivedConfiguration = true;
            store.serverConfiguration = response.data;
            connection.io.emit(EVENTS.requestListedFiles);
          }
        },
      );
    },
  );
};

export const handleDisconnect = (): void => {
  if (connection.io.connected) {
    connection.io.emit(EVENTS.close);

    connection.io.off(EVENTS.changePassword, ioHandlerChangePassword);
    connection.io.off(EVENTS.clientDisconnect, ioHandlerClientDisconnect);
    connection.io.off(EVENTS.deleteAllFiles, ioHandlerDeleteAllFiles);
    connection.io.off(EVENTS.deleteFile, ioHandlerDeleteFile);
    connection.io.off(EVENTS.downloadFile, ioHandlerDownloadFile);
    connection.io.off(EVENTS.listFile, ioHandlerListFile);
    connection.io.off(EVENTS.removePassword, ioHandlerRemoveFilePassword);
    connection.io.off(EVENTS.requestFileChunk, ioHandlerRequestFileChunk);
    connection.io.off(EVENTS.requestListedFiles, ioHandlerRequestListedFiles);
    connection.io.off(EVENTS.updateDeviceName, ioHandlerUpdateDeviceName);
    connection.io.off(EVENTS.updateTotalDownloads, ioHandlerUpdateTotalDownloads);
    connection.io.off(EVENTS.uploadFileChunk, ioHandlerUploadFileChunk);

    store.connected = false;
  }
};

export default connection;
