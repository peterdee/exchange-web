import { convertFileToArrayBufferChunks } from './binary';
import getHash from './get-hash';
import type { ListedFile } from '../types';
import { MAX_FILE_SIZE } from '../configuration';

export default async function prepareSharedFiles(
  files: File[],
  listedFiles: ListedFile[],
  deviceName: string,
  ownerId: string,
): Promise<ListedFile[]> {
  const hashes = await Promise.all(files.map(
    (file: File): Promise<string> => getHash(file),
  ));
  const chunkedFiles = await Promise.all(files.map(convertFileToArrayBufferChunks));
  const result: ListedFile[] = [];
  files.forEach((file: File, index: number): void => {
    const alreadyListed = listedFiles.filter(
      (item: ListedFile): boolean => item.id === hashes[index]
        && item.fileName === file.name && item.fileSize === file.size,
    );
    if (alreadyListed.length === 0 && file.size < MAX_FILE_SIZE) {
      const entry: ListedFile = {
        chunks: chunkedFiles[index],
        createdAt: Date.now(),
        deviceName,
        downloadCompleted: false,
        downloadPercent: 0,
        fileLastModified: file.lastModified,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        grant: '',
        id: hashes[index],
        isDownloading: false,
        isOwner: true,
        ownerId,
        totalDownloads: 0,
        withPassword: false,
      };
      result.push(entry);
    }
  });
  return result;
}
