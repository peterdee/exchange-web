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
        && item.file?.name === file.name && item.file?.size === file.size,
    );
    if (alreadyListed.length === 0) {
      const entry: ListedFile = {
        chunks: [],
        createdAt: Date.now(),
        deviceName,
        downloadCompleted: false,
        downloadPercent: 0,
        file,
        grant: '',
        id: hashes[index],
        isDownloading: false,
        isOwner: true,
        name: file.name,
        ownerId,
        size: file.size,
        withPassword: false,
      };
      console.log('enc len', encoded[0].length);
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
      console.log('chnks', entry.chunks.length);
      result.push(entry);
    }
  });
  return result;
}
