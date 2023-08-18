import { CHUNK_SIZE } from '../configuration';
import { encodeFileToBase64 } from './base64';
import getHash from './get-hash';
import type { ListedFile } from '../types';

export default async function prepareSharedFiles(
  files: File[],
  listedFiles: ListedFile[],
  deviceName: string,
  ownerId: string,
): Promise<ListedFile[]> {
  const hashes = await Promise.all(files.map(
    (file: File): Promise<string> => getHash(file),
  ));
  const encoded = await Promise.all(files.map(encodeFileToBase64));
  const result: ListedFile[] = [];
  files.forEach((file: File, index: number): void => {
    const alreadyListed = listedFiles.filter(
      (item: ListedFile): boolean => item.id === hashes[index]
        && item.fileName === file.name && item.fileSize === file.size,
    );
    if (alreadyListed.length === 0) {
      const entry: ListedFile = {
        chunks: [],
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
        withPassword: false,
      };
      let chunk = '';
      for (let i = 0; i < encoded[index].length; i += 1) {
        chunk += encoded[index][i];
        if (chunk.length === CHUNK_SIZE) {
          entry.chunks.push(chunk);
          chunk = '';
        }
      }
      if (chunk) {
        entry.chunks.push(chunk);
      }
      result.push(entry);
    }
  });
  return result;
}
