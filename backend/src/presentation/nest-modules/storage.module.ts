// src/presentation/nest-modules/storage.module.ts

import { Global, Module } from '@nestjs/common';
import { StorageService } from '../../domain/services/storage.service';
import { SupabaseStorageService } from '../../infrastructure/storage/supabase-storage.service';

@Global()
@Module({
  providers: [
    {
      provide: StorageService,
      useClass: SupabaseStorageService,
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
