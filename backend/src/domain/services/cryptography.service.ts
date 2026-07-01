// src/domain/services/cryptography.service.ts

export abstract class CryptographyService {
  abstract hash(plainText: string): Promise<string>;
  abstract compare(plainText: string, hashedText: string): Promise<boolean>;
}
