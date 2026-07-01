// src/presentation/nest-modules/security.module.ts

import { Global, Module } from '@nestjs/common';
import { CryptographyService } from '../../domain/services/cryptography.service';
import { BcryptCryptographyService } from '../../infrastructure/security/bcrypt-cryptography.service';
import { TokenService } from '../../domain/services/token.service';
import { JwtTokenService } from '../../infrastructure/security/jwt-token.service';

@Global()
@Module({
  providers: [
    {
      provide: CryptographyService,
      useClass: BcryptCryptographyService,
    },
    {
      provide: TokenService,
      useClass: JwtTokenService,
    },
  ],
  exports: [CryptographyService, TokenService],
})
export class SecurityModule {}
