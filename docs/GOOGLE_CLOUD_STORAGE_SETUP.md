# Configuración de Google Cloud Storage

## Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env.local`:

```bash
# Google Cloud Storage Configuration
GCP_PROJECT_ID=migraflix-project
GCS_BUCKET_NAME=migraflix-temp-images

# Credenciales - Elige una de las dos opciones:

# Opción 1: Archivo de credenciales
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json

# Opción 2: JSON inline (recomendado para Vercel)
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"..."...}
```

## Configuración en Google Cloud Console

### 1. Crear Proyecto
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Copia el Project ID

### 2. Habilitar APIs
1. Ve a "APIs & Services" > "Library"
2. Busca y habilita:
   - Cloud Storage API
   - Cloud Storage JSON API

### 3. Crear Service Account
1. Ve a "IAM & Admin" > "Service Accounts"
2. Crea una nueva Service Account con rol "Storage Admin"
3. Crea y descarga la key JSON

### 4. Crear Bucket
1. Ve a "Cloud Storage" > "Buckets"
2. Crea un nuevo bucket con:
   - Nombre: `migraflix-temp-images`
   - Región: `us-central1` (o la más cercana)
   - Clase de almacenamiento: Standard
   - Control de acceso: Uniform

### 5. Configurar CORS (si es necesario)
```json
[
  {
    "origin": ["https://tu-dominio.com"],
    "method": ["GET", "POST", "PUT"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

## Uso en el Código

```typescript
import { getGCSBucket } from '@/lib/config';

const bucket = getGCSBucket();
const file = bucket.file('temp/image.jpg');

// Subir archivo
await file.save(buffer, {
  metadata: { contentType: 'image/jpeg' }
});

// Generar URL firmada
const [url] = await file.getSignedUrl({
  action: 'read',
  expires: Date.now() + 3600000 // 1 hora
});
```

## Limpieza Automática

Los archivos temporales se eliminan automáticamente después de 24 horas usando Cloud Functions o un job programado.