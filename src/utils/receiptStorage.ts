import { Directory, File, Paths } from 'expo-file-system';

const receiptsDir = () => new Directory(Paths.document, 'receipts');

export const persistReceiptImage = (sourceUri: string, txId: string): string => {
  if (!sourceUri.startsWith(Paths.cache.uri)) return sourceUri;
  const dir = receiptsDir();
  if (!dir.exists) dir.create({ intermediates: true });
  const dest = new File(dir, `${txId}.jpg`);
  if (dest.exists) dest.delete();
  new File(sourceUri).copy(dest);
  return dest.uri;
};
