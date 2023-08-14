export default async function sleep(ms = 500): Promise<void> {
  return new Promise<void>((resolve: () => void): void => {
    setTimeout((): void => resolve(), ms);
  });
}
