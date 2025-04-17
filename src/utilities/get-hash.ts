export default function getHash(file: Blob | File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const { target } = event;
      if (!target) {
        return resolve('');
      }
      const binary = target.result;
      if (!binary) {
        return resolve('');
      }
      const result = await crypto.subtle.digest(
        'SHA-1',
        binary as ArrayBuffer,
      );
      return resolve(
        Array.from(new Uint8Array(result))
          .map((symbol) => symbol.toString(16).padStart(2, '0'))
          .join(''),
      );
    }
    reader.readAsArrayBuffer(file);
  });
}
