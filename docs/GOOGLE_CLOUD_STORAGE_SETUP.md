# Configuração do Google Cloud Storage

## Variáveis de Ambiente Necessárias

Adicione estas variáveis ao seu arquivo `.env.local`:

```bash
# Google Cloud Storage Configuration
GCP_PROJECT_ID=chefiandoimages
GCS_BUCKET_NAME=migraflix-temp-images

# BANDEIRA PARA HABILITAR GCS (true = usar GCS, false/undefined = usar base64)
TEST_UPLOAD=false

# Credenciais - Apenas necessárias se TEST_UPLOAD=true
# Opção 1: Arquivo de credenciais
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json

# Opção 2: JSON inline (recomendado para Vercel)
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"..."...}
```

## Configuração no Google Cloud Console

### 1. Criar Projeto
1. Vá para [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Copie o Project ID

### 2. Habilitar APIs
1. Vá para "APIs & Services" > "Library"
2. Procure e habilite:
   - Cloud Storage API
   - Cloud Storage JSON API

### 3. Criar Service Account
1. Vá para "IAM & Admin" > "Service Accounts"
2. Crie uma nova Service Account com o papel "Storage Admin"
3. Crie e baixe a chave JSON

### 4. Criar Bucket
1. Vá para "Cloud Storage" > "Buckets"
2. Crie um novo bucket com:
   - Nome: `migraflix-temp-images`
   - Região: `us-central1` (ou a mais próxima)
   - Classe de armazenamento: Standard
   - Controle de acesso: Uniform

### 5. Configurar CORS (se necessário)
```json
[
  {
    "origin": ["https://seu-dominio.com"],
    "method": ["GET", "POST", "PUT"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

## Uso no Código

```typescript
import { getGCSBucket } from '@/lib/config';

const bucket = getGCSBucket();
const file = bucket.file('temp/image.jpg');

// Subir arquivo
await file.save(buffer, {
  metadata: { contentType: 'image/jpeg' }
});

// Gerar URL assinada
const [url] = await file.getSignedUrl({
  action: 'read',
  expires: Date.now() + 3600000 // 1 hora
});
```

## Modo de Teste vs Produção

### Usando a Bandeira TEST_UPLOAD

**Para usar base64 (método atual - produção):**
```bash
TEST_UPLOAD=false
# ou simplesmente não definir a variável
```

**Para usar Google Cloud Storage (nova funcionalidade):**
```bash
TEST_UPLOAD=true
GCP_PROJECT_ID=seu-project-id
GCS_BUCKET_NAME=seu-bucket-name
GOOGLE_APPLICATION_CREDENTIALS_JSON={...}
```

### Benefícios da Bandeira

- ✅ **Teste seguro**: Teste GCS sem afetar produção
- ✅ **Alternância fácil**: Mude uma única variável
- ✅ **Rollback imediato**: Se houver problemas, volte para base64
- ✅ **Configuração gradual**: Configure GCS enquanto mantém funcionamento

## Limpeza Automática

Os arquivos temporários são excluídos automaticamente após 24 horas usando Cloud Functions ou um job programado.