export function decodeStringToBlob(string: string, type: string = ''): Blob {
  const bytes = window.atob(string);
  const arrayBuffer = new ArrayBuffer(bytes.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < bytes.length; i += 1) {
    uint8Array[i] = bytes.charCodeAt(i);
  }
  const options: { type?: string } = {};
  if (type) {
    options.type = type;
  }
  return new Blob([uint8Array], options);
}

export function encodeArrayBufferToString(file: File): Promise<string> {
  return new Promise<string>(
    (resolve): void => {
      const reader = new FileReader();
      reader.onload = async (event: ProgressEvent<FileReader>) => {
        const { target } = event;
        if (!target) {
          return resolve('');
        }
        const binary = target.result;
        if (!binary) {
          return resolve('');
        }
        const bytes = new Uint8Array(binary as ArrayBuffer);
        let string = '';
        for (let i = 0; i < bytes.length; i += 1) {
          string += String.fromCharCode(bytes[i]);
        }
        return resolve(window.btoa(string));
      }
      reader.readAsArrayBuffer(file);
    },
  );
}
