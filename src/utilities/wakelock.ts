let wakeLock: WakeLockSentinel;

export const requestWakeLock = async () => {
  if ('wakeLock' in navigator && 'request' in navigator.wakeLock) {
    wakeLock = await navigator.wakeLock.request('screen');
  }
}

const handleVisibilityChange = async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    await requestWakeLock();
  }
};

document.addEventListener('visibilitychange', handleVisibilityChange);
