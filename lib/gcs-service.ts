import { getGCSBucket, GCS_CONFIG } from './config';
import { Storage } from '@google-cloud/storage';

export interface GCSFileInfo {
  fileName: string;
  gcsPath: string;
  publicUrl?: string;
  signedUrl?: string;
  size?: number;
  contentType?: string;
}

/**
 * Servicio para manejar archivos en Google Cloud Storage
 */
export class GCSService {
  private bucket = getGCSBucket();

  /**
   * Sube un archivo desde base64 a GCS
   */
  async uploadFromBase64(
    base64Data: string,
    fileName: string,
    contentType: string,
    options: {
      prefix?: string;
      makePublic?: boolean;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<GCSFileInfo> {
    try {
      // Por defecto subir al root, no a carpeta temp
      const { prefix = '', makePublic = false, metadata = {} } = options;

      // Decodificar base64
      const buffer = Buffer.from(base64Data, 'base64');

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const uniqueFileName = `${prefix}${timestamp}_${randomId}_${fileName}`;
      const gcsPath = uniqueFileName;

      console.log(`📤 Subiendo archivo a GCS: ${gcsPath} (${buffer.length} bytes)`);

      const file = this.bucket.file(gcsPath);

      // Metadata del archivo
      const fileMetadata = {
        contentType,
        metadata: {
          originalName: fileName,
          uploadedAt: new Date().toISOString(),
          ...metadata,
        },
      };

      // Subir archivo
      await file.save(buffer, {
        metadata: fileMetadata,
        public: makePublic,
        resumable: false, // Para archivos pequeños, no usar resumable
      });

      console.log(`✅ Archivo subido exitosamente: ${gcsPath}`);

      // Generar URLs
      const publicUrl = makePublic ? `https://storage.googleapis.com/${GCS_CONFIG.bucketName}/${gcsPath}` : undefined;
      const signedUrl = await this.generateSignedUrl(gcsPath, 'read');

      return {
        fileName: uniqueFileName,
        gcsPath,
        publicUrl,
        signedUrl,
        size: buffer.length,
        contentType,
      };
    } catch (error) {
      console.error('❌ Error subiendo archivo a GCS:', error);
      throw new Error(`Failed to upload file to GCS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sube un archivo desde Buffer a GCS
   */
  async uploadFromBuffer(
    buffer: Buffer,
    fileName: string,
    contentType: string,
    options: {
      prefix?: string;
      makePublic?: boolean;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<GCSFileInfo> {
    try {
      // Por defecto subir al root, no a carpeta temp
      const { prefix = '', makePublic = false, metadata = {} } = options;

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const uniqueFileName = `${prefix}${timestamp}_${randomId}_${fileName}`;
      const gcsPath = uniqueFileName;

      console.log(`📤 Subiendo archivo a GCS: ${gcsPath} (${buffer.length} bytes)`);

      const file = this.bucket.file(gcsPath);

      // Metadata del archivo
      const fileMetadata = {
        contentType,
        metadata: {
          originalName: fileName,
          uploadedAt: new Date().toISOString(),
          ...metadata,
        },
      };

      // Subir archivo
      await file.save(buffer, {
        metadata: fileMetadata,
        public: makePublic,
        resumable: false,
      });

      console.log(`✅ Archivo subido exitosamente: ${gcsPath}`);

      // Generar URLs
      const publicUrl = makePublic ? `https://storage.googleapis.com/${GCS_CONFIG.bucketName}/${gcsPath}` : undefined;
      const signedUrl = await this.generateSignedUrl(gcsPath, 'read');

      return {
        fileName: uniqueFileName,
        gcsPath,
        publicUrl,
        signedUrl,
        size: buffer.length,
        contentType,
      };
    } catch (error) {
      console.error('❌ Error subiendo archivo a GCS:', error);
      throw new Error(`Failed to upload file to GCS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Descarga un archivo desde GCS
   */
  async downloadFile(gcsPath: string): Promise<Buffer> {
    try {
      console.log(`📥 Descargando archivo desde GCS: ${gcsPath}`);

      const file = this.bucket.file(gcsPath);
      const [buffer] = await file.download();

      console.log(`✅ Archivo descargado exitosamente: ${gcsPath} (${buffer.length} bytes)`);

      return buffer;
    } catch (error) {
      console.error('❌ Error descargando archivo desde GCS:', error);
      throw new Error(`Failed to download file from GCS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Elimina un archivo desde GCS
   */
  async deleteFile(gcsPath: string): Promise<void> {
    try {
      console.log(`🗑️ Eliminando archivo de GCS: ${gcsPath}`);

      const file = this.bucket.file(gcsPath);
      await file.delete();

      console.log(`✅ Archivo eliminado exitosamente: ${gcsPath}`);
    } catch (error) {
      console.error('❌ Error eliminando archivo de GCS:', error);
      throw new Error(`Failed to delete file from GCS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Genera una URL firmada para acceder al archivo
   */
  async generateSignedUrl(gcsPath: string, action: 'read' | 'write' | 'delete' = 'read'): Promise<string> {
    try {
      const file = this.bucket.file(gcsPath);
      const [url] = await file.getSignedUrl({
        action,
        expires: Date.now() + GCS_CONFIG.signedUrlExpiry,
      });

      return url;
    } catch (error) {
      console.error('❌ Error generando URL firmada:', error);
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verifica si un archivo existe en GCS
   */
  async fileExists(gcsPath: string): Promise<boolean> {
    try {
      const file = this.bucket.file(gcsPath);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      console.error('❌ Error verificando existencia de archivo:', error);
      return false;
    }
  }

  /**
   * Obtiene metadata de un archivo
   */
  async getFileMetadata(gcsPath: string): Promise<any> {
    try {
      const file = this.bucket.file(gcsPath);
      const [metadata] = await file.getMetadata();
      return metadata;
    } catch (error) {
      console.error('❌ Error obteniendo metadata del archivo:', error);
      throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lista archivos con un prefijo
   */
  async listFiles(prefix?: string): Promise<string[]> {
    try {
      const [files] = await this.bucket.getFiles({
        prefix,
      });

      return files.map(file => file.name);
    } catch (error) {
      console.error('❌ Error listando archivos:', error);
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Limpia archivos temporales antiguos
   */
  async cleanupOldTempFiles(): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - (GCS_CONFIG.cleanupAfterHours * 60 * 60 * 1000));

      console.log(`🧹 Iniciando limpieza de archivos temporales anteriores a ${cutoffDate.toISOString()}`);

      const tempFiles = await this.listFiles(GCS_CONFIG.tempPrefix);
      let deletedCount = 0;

      for (const filePath of tempFiles) {
        try {
          const metadata = await this.getFileMetadata(filePath);
          const uploadedAt = new Date(metadata.metadata?.uploadedAt || metadata.timeCreated);

          if (uploadedAt < cutoffDate) {
            await this.deleteFile(filePath);
            deletedCount++;
            console.log(`🗑️ Archivo antiguo eliminado: ${filePath}`);
          }
        } catch (error) {
          console.warn(`⚠️ Error procesando archivo ${filePath}:`, error);
        }
      }

      console.log(`✅ Limpieza completada. ${deletedCount} archivos eliminados.`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error en limpieza de archivos temporales:', error);
      throw new Error(`Failed to cleanup temp files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Instancia singleton del servicio
export const gcsService = new GCSService();