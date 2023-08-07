import {
  SUPPORTS_FS_ACCESS_API,
  SUPPORTS_WEBKIT_GET_AS_ENTRY,
} from '../configuration';

export default async function getFilesFromDroppedItems(
  dataTransfer: DataTransfer,
): Promise<File[]> {
  let itemType = 'FileSystemHandle';
  const promises = [...dataTransfer.items]
    .filter((item: DataTransferItem): boolean => item.kind === 'file')
    .map((item: DataTransferItem) => {
      if (SUPPORTS_FS_ACCESS_API && (item as any).getAsFileSystemHandle) {
        return (item as any).getAsFileSystemHandle();
      }
      if (SUPPORTS_WEBKIT_GET_AS_ENTRY) {
        itemType = 'FileSystemEntry';
        return item.webkitGetAsEntry();
      }
      itemType = 'File';
      return item.getAsFile();
    });
  const results = await Promise.all(promises);
  const filtered = results.filter((item: unknown): boolean => {
    if (itemType === 'FileSystemHandle'
      && (item as FileSystemFileHandle).kind === 'file') {
      return true;
    }
    if (itemType === 'FileSystemEntry'
      && (item as FileSystemFileEntry).isFile) {
      return true;
    }
    if (itemType === 'File') {
      const { name = '', type = '' } = (item as File);
      if (!(name.includes('.') && !!type)) {
        return false;
      }
      return true;
    }
    return false;
  });
  let files: File[] = [];
  if (itemType === 'FileSystemHandle') {
    files = await Promise.all(filtered.map(
      (item: unknown): Promise<File> => (item as FileSystemFileHandle).getFile(),
    ));
  }
  if (itemType === 'FileSystemEntry') {
    const promises = filtered.map(
      (item: unknown): Promise<File> => new Promise<File>((resolve): void => {
        (item as FileSystemFileEntry).file(resolve);
      }),
    );
    files = await Promise.all(promises);
  }
  if (itemType === 'File') {
    files = (filtered as File[]);
  }
  return files;
}
