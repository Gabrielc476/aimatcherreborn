// src/infrastructure/storage/supabase-storage.service.ts

import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageService } from '../../domain/services/storage.service';

@Injectable()
export class SupabaseStorageService implements StorageService {
  private supabase: SupabaseClient;
  private readonly bucketName = 'curriculos';

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      // Evita travar a inicialização se as variáveis de ambiente não estiverem configuradas ainda
      console.warn('Configurações do Supabase ausentes no .env. O serviço de Storage não funcionará.');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseSecretKey);
  }

  async uploadCurriculo(userId: string, fileBuffer: Buffer, fileName: string): Promise<string> {
    this.checkClientInitialized();

    const timestamp = Date.now();
    const cleanFileName = this.sanitizeFilename(fileName);
    const path = `${userId}/${timestamp}_${cleanFileName}`;

    let uploadResponse = await this.supabase.storage
      .from(this.bucketName)
      .upload(path, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadResponse.error) {
      // Se o bucket não existe, tenta criá-lo e refazer o upload
      if (uploadResponse.error.message.includes('Bucket not found') || uploadResponse.error.message.includes('bucket')) {
        const createResult = await this.supabase.storage.createBucket(this.bucketName, { public: false });
        if (createResult.error) {
          throw new Error(`Erro ao criar o bucket '${this.bucketName}': ${createResult.error.message}`);
        }

        // Tenta fazer o upload novamente
        uploadResponse = await this.supabase.storage
          .from(this.bucketName)
          .upload(path, fileBuffer, {
            contentType: 'application/pdf',
            upsert: true,
          });
      }
    }

    if (uploadResponse.error) {
      throw new Error(`Erro ao subir currículo para o Supabase Storage: ${uploadResponse.error.message}`);
    }

    return uploadResponse.data.path;
  }

  async obterUrlDownload(path: string): Promise<string> {
    this.checkClientInitialized();

    // Gera link assinado válido por 15 minutos (900 segundos)
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUrl(path, 900);

    if (error) {
      throw new Error(`Erro ao gerar URL assinada: ${error.message}`);
    }

    return data.signedUrl;
  }

  async excluirCurriculo(path: string): Promise<boolean> {
    this.checkClientInitialized();

    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      console.error(`Erro ao excluir currículo no Supabase: ${error.message}`);
      return false;
    }

    return true;
  }

  private sanitizeFilename(fileName: string): string {
    let decoded = fileName;
    try {
      decoded = decodeURIComponent(escape(fileName));
    } catch (e) {
      // Ignora se falhar
    }

    return decoded
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/\s+/g, '_') // substitui espaços por _
      .replace(/[^a-zA-Z0-9.\-_]/g, ''); // remove caracteres especiais
  }

  private checkClientInitialized(): void {
    if (!this.supabase) {
      throw new Error('Supabase Client não inicializado. Verifique as variáveis de ambiente.');
    }
  }
}
