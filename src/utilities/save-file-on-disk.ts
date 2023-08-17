export default function saveFileOnDisk(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const downloadLink = window.document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = name;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  return URL.revokeObjectURL(url);
}
