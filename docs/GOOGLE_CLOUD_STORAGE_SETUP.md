# Configuración de Google Cloud Storage

## Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env.local`:

```bash
# Google Cloud Storage Configuration
GCP_PROJECT_ID=chefiandoimages
GCS_BUCKET_NAME=migraflix-temp-images
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"chefiandoimages","private_key_id":"tu_private_key_id","private_key":"-----BEGIN PRIVATE KEY-----\ntu_private_key_completa\n-----END PRIVATE KEY-----\n","client_email":"tu-service-account@chefiandoimages.iam.gserviceaccount.com","client_id":"tu_client_id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/tu-service-account%40chefiandoimages.iam.gserviceaccount.com"}

# BANDERA PARA HABILITAR GCS (true = usar GCS, false/undefined = usar base64)
TEST_UPLOAD=false

# Credenciales - Solo necesarias si TEST_UPLOAD=true
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
3. **Crear y descargar la clave JSON:**

   **Paso a paso detallado:**

   a) **Acceder a la Service Account:**
      - En "IAM & Admin" > "Service Accounts", haz clic en el nombre de la Service Account que acabas de crear

   b) **Ir a la pestaña Keys:**
      - En la página de detalles de la Service Account, haz clic en la pestaña "Keys" (Claves) en la parte superior

   c) **Crear nueva clave:**
      - Haz clic en el botón "Add Key" (Agregar clave)
      - Selecciona "Create new key" (Crear nueva clave) del menú desplegable

   d) **Seleccionar tipo JSON:**
      - En la ventana emergente, selecciona "JSON" como tipo de clave
      - Haz clic en "Create" (Crear)

   e) **Descargar archivo:**
      - El archivo JSON se descargará automáticamente a tu carpeta de descargas
      - El archivo se llamará algo como: `chefiandoimages-[random-id].json`

   f) **Guardar el archivo:**
      - **IMPORTANTE**: Mueve este archivo a una carpeta segura en tu computadora
      - **NUNCA** lo subas a Git o lo compartas
      - Esta es tu única copia de las credenciales

   **Contenido del archivo JSON:**
   ```json
   {
     "type": "service_account",
     "project_id": "chefiandoimages",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...",
     "client_email": "service-account@chefiandoimages.iam.gserviceaccount.com",
     "client_id": "...",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
   }
   ```

   **Usar el archivo descargado:**
   - **Opción 1**: Copia todo el contenido JSON y pégalo como valor de `GOOGLE_APPLICATION_CREDENTIALS_JSON` en `.env.local`
   - **Opción 2**: Guarda el archivo como `service-account-key.json` en tu proyecto y usa `GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json`

### 4. Crear Bucket
1. Ve a "Cloud Storage" > "Buckets"
2. Crea un nuevo bucket con:
   - Nombre: `migraflix-temp-images`
   - Región: `us-central1` (o la más cercana)
   - Clase de almacenamiento: Standard
   - Control de acceso: Uniform

**Nota**: Con Google Cloud Storage, ya no hay límite de 5MB para las imágenes. Los usuarios pueden subir archivos de cualquier tamaño (dentro de los límites de GCS).

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

## Modo de Prueba vs Producción

### Usando la Bandera TEST_UPLOAD

**Para usar base64 (método actual - producción):**
```bash
TEST_UPLOAD=false
# o simplemente no definir la variable
```

**Para usar Google Cloud Storage (nueva funcionalidad):**
```bash
TEST_UPLOAD=true
GCP_PROJECT_ID=chefiandoimages
GCS_BUCKET_NAME=migraflix-temp-images
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"chefiandoimages",...}
```

### Beneficios de la Bandera

- ✅ **Testing seguro**: Prueba GCS sin afectar producción
- ✅ **Fácil alternancia**: Cambia una sola variable
- ✅ **Rollback inmediato**: Si hay problemas, vuelve a base64
- ✅ **Configuración gradual**: Configura GCS mientras mantienes funcionamiento

## Solución de Problemas

### Problemas con las Credenciales

**Error: "Invalid credentials" o "Could not load the default credentials"**
- Verifica que el JSON de la clave sea válido (no esté truncado)
- Asegúrate de que la Service Account tenga el rol "Storage Admin"
- Confirma que el `project_id` en el JSON coincida con `GCP_PROJECT_ID`

**Error: "Access denied"**
- Verifica que la Service Account tenga permisos en el bucket
- Asegúrate de que el bucket existe y está en la región correcta

**Error: "Bucket does not exist"**
- Confirma que creaste el bucket con el nombre exacto: `migraflix-temp-images`
- Verifica que esté en la región correcta

### Regenerar Clave si se pierde

Si pierdes la clave JSON:

1. Ve a "IAM & Admin" > "Service Accounts"
2. Haz clic en tu Service Account
3. Ve a la pestaña "Keys"
4. Elimina la clave antigua (si existe)
5. Crea una nueva clave siguiendo los pasos anteriores

**⚠️ IMPORTANTE**: Al crear una nueva clave, la anterior deja de funcionar inmediatamente.

## Archivos Helper para Configuración

### `env-template-gcs.txt`
Archivo template con todas las variables de entorno necesarias. Copia su contenido a tu `.env.local` y reemplaza los valores entre `[]` con tus credenciales reales.

### `validate-gcs-json.js`
Script para validar que tu JSON de Google Cloud Storage es válido y completo. Ejecuta con:
```bash
node validate-gcs-json.js
```

Este script te ayudará a verificar que:
- El JSON es válido
- Todos los campos requeridos están presentes
- El project_id coincide
- La estructura es correcta

### `test-gcs-connection.js`
Script avanzado para probar la conexión real con Google Cloud Storage. **No requiere que el bucket exista**. Ejecuta con:
```bash
node test-gcs-connection.js
```

Este script prueba:
- ✅ **Credenciales válidas** - Verifica que el JSON se puede parsear
- ✅ **Conectividad básica** - Intenta conectarse a Google Cloud
- ✅ **Cliente GCS** - Inicializa el cliente de Storage
- ✅ **Proyecto accesible** - Verifica que tienes acceso al proyecto
- ✅ **Buckets existentes** - Lista buckets disponibles
- ✅ **Bucket objetivo** - Intenta crear o acceder al bucket `migraflix-temp-images`
- ✅ **Permisos** - Verifica que tienes permisos para Storage

**¡Este es el script principal para probar tu configuración antes de crear el bucket!**

### Página de Prueba `/test-upload`
Página web simple para probar la subida de imágenes desde el navegador:

```
http://localhost:3000/test-upload
```

**Características:**
- ✅ Interfaz gráfica simple
- ✅ Preview de imágenes
- ✅ Validación de archivos
- ✅ Resultados detallados
- ✅ Información de GCS si está activado
- ✅ Debug completo

**Uso recomendado:**
1. Ve a `http://localhost:3000/test-upload`
2. Selecciona una imagen
3. Haz clic en "Subir Imagen"
4. Revisa los resultados y logs

**¡Esta es la forma más fácil de probar GCS antes de activarlo en producción!**

## Checklist Final

- ✅ **Proyecto creado** en Google Cloud Console
- ✅ **APIs habilitadas**: Cloud Storage API y Cloud Storage JSON API
- ✅ **Service Account creada** con rol "Storage Admin"
- ✅ **Clave JSON descargada** y guardada de forma segura
- ✅ **Conexión probada** con `test-gcs-connection.js`
- ✅ **Bucket creado/accesible**: `migraflix-temp-images`
- ✅ **Variables configuradas** en `.env.local`
- ✅ **JSON validado** con el script helper
- ✅ **TEST_UPLOAD=true** para habilitar GCS

## Limpieza Automática

Los archivos temporales se eliminan automáticamente después de 24 horas usando Cloud Functions o un job programado.