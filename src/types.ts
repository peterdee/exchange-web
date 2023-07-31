export interface ListedFile {
  chunks: string[];
  createdAt: number;
  file?: File;
  id: string;
  isOwner?: boolean;
  name: string;
  ownerId: string;
  private: boolean;
  size: number;
}
