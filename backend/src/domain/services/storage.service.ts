// src/domain/services/storage.service.ts

export abstract class StorageService {
  abstract uploadCurriculo(userId: string, fileBuffer: Buffer, fileName: string): Promise<string>;
  abstract obterUrlDownload(path: string): Promise<string>;
  abstract excluirCurriculo(path: string): Promise<boolean>;
}
