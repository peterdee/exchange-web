export default function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < Math.pow(1024, 2)) {
    return `${(size / 1024).toFixed(2)} KB`;
  }
  const megabytes = size / 1024 / 1024;
  if (megabytes > 1024) {
    return `${(megabytes / 1024).toFixed(2)} GB`;
  }
  return `${megabytes.toFixed(2)} MB`;
}
