export function convertArrayBufferChunksToBlob(
  chunks: ArrayBuffer[],
  type: string = '',
): Blob {
  return new Blob([...chunks], { type });
}

export function convertFileToArrayBufferChunks(
  file: File,
  chunkSizeBytes: number,
): Promise<ArrayBuffer[]> {
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
        const chunksNumber = Math.ceil(binary.byteLength / chunkSizeBytes);
        if (chunksNumber === 1) {
          return resolve([binary]);
        }
        const chunks: ArrayBuffer[] = [];
        for (let i = 0; i < chunksNumber; i += 1) {
          const begin = chunkSizeBytes * i;
          const end = i < chunksNumber - 1
            ? begin + chunkSizeBytes
            : binary.byteLength;
          chunks.push(binary.slice(begin, end));
        }
        return resolve(chunks);
      }
      reader.readAsArrayBuffer(file);
    },
  );
}
