import { Storage } from '@google-cloud/storage';

// Configuración de Google Cloud Storage
export const GCS_CONFIG = {
  projectId: process.env.GCP_PROJECT_ID || 'migraflix-project',
  bucketName: process.env.GCS_BUCKET_NAME || 'migraflix-temp-images',
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  // URLs firmadas expiran en 1 hora
  signedUrlExpiry: 60 * 60 * 1000, // 1 hora en milisegundos
  // Prefijo para archivos temporales
  tempPrefix: 'temp/',
  // Limpieza automática después de 24 horas
  cleanupAfterHours: 24,
};

// Inicializar cliente de GCS
let gcsClient: Storage | null = null;

export function getGCSClient(): Storage {
  if (!gcsClient) {
    if (!GCS_CONFIG.keyFilename && !process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      throw new Error('Google Cloud credentials not configured. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS_JSON');
    }

    const config: any = {
      projectId: GCS_CONFIG.projectId,
    };

    // Si tenemos credentials como JSON string (para Vercel)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      config.credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    } else if (GCS_CONFIG.keyFilename) {
      config.keyFilename = GCS_CONFIG.keyFilename;
    }

    gcsClient = new Storage(config);
  }

  return gcsClient;
}

// Función helper para obtener el bucket
export function getGCSBucket() {
  const storage = getGCSClient();
  return storage.bucket(GCS_CONFIG.bucketName);
}