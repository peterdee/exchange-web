export type StorageKey = 'deviceName' | 'deviceNameSet';

interface StoredItem<T> {
  value: T;
}

export function getValue<T>(key: StorageKey): null | T {
  const string = localStorage.getItem(key);
  if (!string) {
    return null;
  }
  try {
    const item: StoredItem<T> = JSON.parse(string);
    return item.value;
  } catch {
    return null;
  }
}

export function setValue<T>(key: StorageKey, value: T): void {
  const item: StoredItem<T> = { value };
  return localStorage.setItem(key, JSON.stringify(item));
}
