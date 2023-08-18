import { CHUNK_SIZE } from '../configuration';

export function convertArrayBufferChunksToBlob(
  chunks: ArrayBuffer[],
  type: string = '',
): Blob {
  for (let i = 0; i < chunks.length; i += 1) {

  }
}

export function convertFileToArrayBufferChunks(file: File): Promise<ArrayBuffer[]> {
  return new Promise<ArrayBuffer[]>(
    (resolve): void => {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>): void => {
        const { target } = event;
        if (!target) {
          return resolve([]);
        }
        const binary = target.result as ArrayBuffer;
        if (!binary) {
          return resolve([]);
        }
        const chunksNumber = Math.ceil(binary.byteLength / CHUNK_SIZE);
        if (chunksNumber === 1) {
          return resolve([binary]);
        }
        const chunks: ArrayBuffer[] = [];
        for (let i = 0; i < chunksNumber; i += 1) {
          const begin = CHUNK_SIZE * i;
          const end = i < chunksNumber - 1
            ? begin + CHUNK_SIZE
            : binary.byteLength;
          chunks.push(binary.slice(begin, end));
        }
        return resolve(chunks);
      }
      reader.readAsArrayBuffer(file);
    },
  );
}
