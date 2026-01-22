# Actualización del Workflow de n8n para Google Cloud Storage

## Cambios Necesarios

Con la nueva integración de GCS, el webhook ya no recibe `base64` directamente, sino información sobre archivos en Google Cloud Storage. El workflow de n8n debe actualizarse para descargar las imágenes desde GCS.

## Nuevo Formato del Payload

### Payload Anterior (con base64):
```json
{
  "marca": "recXZDcWpXKByiQGj",
  "brandRecordId": "recXZDcWpXKByiQGj",
  "batch": 1,
  "totalBatches": 3,
  "products": [
    {
      "recordId": "temp_1769116529067_0",
      "nombre": "IMG_9113.jpeg",
      "contentType": "image/jpeg",
      "base64": "/9j/4TBKRXhpZgAATU0AKgAAAAgADAEPAAIAAAAGAAAAngEQAAIAAAAKAAAApAESAAMAAAABAAYAAAEaAAUAAAABAAAArgEbAAUAAAABAAAAtgEoAAMAAAABAAIAAAExAAIAAAAHAAAAvgEyAAIAAAAUAAAAxgE8AAIAAAAKAAAA2gITAAMAAAABAAEAAIdpAAQAAAABAAAA5IglAAQAAAABAAAJdgAACqxBcHBsZQBpUGhvbmUgMTEAAAAASAAAAAEAAABIAAAAAT..."
    }
  ]
}
```

### Nuevo Payload (con GCS):
```json
{
  "marca": "recXZDcWpXKByiQGj",
  "brandRecordId": "recXZDcWpXKByiQGj",
  "batch": 1,
  "totalBatches": 3,
  "products": [
    {
      "recordId": "temp_1769116529067_0",
      "nombre": "IMG_9113.jpeg",
      "contentType": "image/jpeg",
      "gcsPath": "products/1703123456789_abc123_IMG_9113.jpeg",
      "gcsSignedUrl": "https://storage.googleapis.com/...",
      "fileSize": 2048576
    }
  ]
}
```

## Actualización del Workflow

### 1. Reemplazar Nodo de "Upload File"

**Eliminar el nodo actual:**
- `Upload File` que intenta subir directamente a Airtable

**Agregar nuevos nodos:**

#### Nodo 1: "Download from GCS"
```
Tipo: HTTP Request
Método: GET
URL: https://tu-dominio.com/api/products/download-gcs/{{ $('Split Out').item.json.gcsPath }}
Enviar Body: No
Enviar Headers: No
```

#### Nodo 2: "Upload to Airtable"
```
Tipo: HTTP Request
Método: POST
URL: https://content.airtable.com/v0/apprcCvYyrWqDXKay/{{ $('Split Out').item.json.recordId }}/Imagen/uploadAttachment
Enviar Body: Sí
Body Parameters:
  - Name: contentType, Value: {{ $('Split Out').item.json.contentType }}
  - Name: file, Value: {{ $('Download from GCS').item.binary.data }}
  - Name: filename, Value: {{ $('Split Out').item.json.nombre }}
```

### 2. Conectar los Nodos

```
Webhook → Split Out → Download from GCS → Upload to Airtable → [resto del workflow]
```

### 3. Configuración del Nodo "Download from GCS"

```json
{
  "parameters": {
    "method": "GET",
    "url": "=https://tu-dominio.com/api/products/download-gcs/{{ $('Split Out').item.json.gcsPath }}",
    "sendBody": false,
    "sendHeaders": false,
    "options": {}
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [200, -400],
  "id": "download-gcs-node",
  "name": "Download from GCS"
}
```

### 4. Configuración del Nodo "Upload to Airtable"

```json
{
  "parameters": {
    "method": "POST",
    "url": "=https://content.airtable.com/v0/apprcCvYyrWqDXKay/{{ $('Split Out').item.json.recordId }}/Imagen/uploadAttachment",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "airtableTokenApi",
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "contentType",
          "value": "={{ $('Split Out').item.json.contentType }}"
        },
        {
          "name": "file",
          "value": "={{ $('Download from GCS').item.binary.data }}"
        },
        {
          "name": "filename",
          "value": "={{ $('Split Out').item.json.nombre }}"
        }
      ]
    },
    "options": {}
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [400, -400],
  "id": "upload-airtable-node",
  "name": "Upload to Airtable",
  "credentials": {
    "airtableTokenApi": {
      "id": "GE0E4EvJ7Qg1uPSX",
      "name": "Migraflix"
    }
  }
}
```

## Beneficios de la Nueva Arquitectura

1. **Archivos más grandes**: GCS puede manejar archivos mucho más grandes que el límite de payload de Vercel
2. **Mejor rendimiento**: Las imágenes se descargan directamente desde GCS sin pasar por el servidor Next.js
3. **Menor carga**: El webhook solo recibe metadata, no datos binarios pesados
4. **Escalabilidad**: GCS está optimizado para almacenamiento y distribución de archivos
5. **Costo eficiente**: Solo pagas por el almacenamiento usado, no por transferencia innecesaria

## Testing

1. Sube una imagen de prueba a través del formulario
2. Verifica que se suba correctamente a GCS
3. Ejecuta el workflow de n8n actualizado
4. Verifica que la imagen llegue correctamente a Airtable

## Limpieza Automática

Los archivos temporales en GCS se eliminan automáticamente cada 24 horas a través del endpoint:
```
POST https://tu-dominio.com/api/maintenance/cleanup-gcs
Authorization: Bearer migraflix-cleanup-2024
```

Configura un cron job para llamar este endpoint diariamente.