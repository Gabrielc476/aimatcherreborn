// src/infrastructure/security/bcrypt-cryptography.service.ts

import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CryptographyService } from '../../domain/services/cryptography.service';

@Injectable()
export class BcryptCryptographyService implements CryptographyService {
  private readonly saltRounds = 10;

  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.saltRounds);
  }

  async compare(plainText: string, hashedText: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashedText);
  }
}
