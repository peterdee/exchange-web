export default async function wakeLock(): Promise<void> {
  if ('wakeLock' in navigator) {
    await navigator.wakeLock.request();
  }
}
