# Plan de Implementación: Formularios de Registro de Marca

## 📋 Resumen Ejecutivo

**Proyecto**: Sistema de registro de marcas/restaurantes para Migraflix  
**Tabla Airtable**: `tblJGkhNnljbmZkrr` (Brands)  
**Objetivo**: Crear un flujo de dos formularios para recopilar información de restaurantes y sus imágenes.

**Alcance**:

- Formulario 1: Registro inicial con 7 preguntas sobre el restaurante
- Formulario 2: Subida de fotos del restaurante (detalles a definir)
- Integración completa con Airtable
- Experiencia de usuario fluida y moderna

---

## 🎯 Objetivos del Proyecto

### Objetivos Principales

1. **Formulario 1 - Registro del Restaurante**

   - Recopilar información esencial del restaurante
   - Validar datos obligatorios en tiempo real
   - Crear registro en Airtable automáticamente
   - Generar link único para formulario 2

2. **Formulario 2 - Subida de Fotos**

   - Permitir carga de múltiples imágenes
   - Asociar fotos al registro creado en Formulario 1
   - Validar formato y tamaño de archivos

3. **Experiencia de Usuario**
   - Diseño limpio y moderno
   - Una pregunta a la vez con animaciones suaves
   - Indicadores de progreso claros
   - Responsive y accesible

### Objetivos Secundarios

- Determinar idioma automáticamente basado en país/ciudad
- Generar link único para subida de fotos
- Validación robusta de datos
- Manejo de errores amigable

---

## 📝 Formulario 1: Registro del Restaurante

### Especificación de Preguntas

#### Pregunta 1: Nombre del Contacto

- **Texto de la pregunta**: "¿Cómo te llamas?"
- **Tipo de campo**: Text Input
- **Campo Airtable**: `Emprendedor`
- **Validación**: Opcional
- **Placeholder**: "Ej: Juan Pérez"
- **Notas**: Nombre del dueño o persona de contacto del restaurante

#### Pregunta 2: Nombre del Negocio ⭐

- **Texto de la pregunta**: "¿Cuál es el nombre de tu negocio?"
- **Tipo de campo**: Text Input
- **Campo Airtable**: `Negocio`
- **Validación**: **OBLIGATORIO** - Mínimo 2 caracteres
- **Placeholder**: "Ej: Sabores de Venezuela"
- **Mensaje de error**: "El nombre del negocio es obligatorio"
- **Notas**: Campo ya existe en la tabla Airtable

#### Pregunta 3: Ciudad

- **Texto de la pregunta**: "¿En qué ciudad queda tu negocio?"
- **Tipo de campo**: Text Input con autocompletado (opcional)
- **Campo Airtable**: `Ciudad`
- **Validación**: Opcional
- **Placeholder**: "Ej: Lima"
- **Notas**: Determina idioma y características locales para generación de contenido

#### Pregunta 4: País

- **Texto de la pregunta**: "¿En qué país queda tu negocio?"
- **Tipo de campo**: Select/Dropdown
- **Campo Airtable**: `País`
- **Validación**: Opcional
- **Opciones**: Lista de países (Perú, Colombia, Chile, Argentina, etc.)
- **Notas**:
  - Determina idioma automáticamente
  - Características locales para textos
  - Puede pre-llenar ciudad si hay relación

#### Pregunta 5: WhatsApp ⭐

- **Texto de la pregunta**: "¿Cuál es el WhatsApp de tu negocio? Nos comunicaremos por aquí."
- **Tipo de campo**: Tel Input
- **Campo Airtable**: `Call to Action (Whatsapp del negocio)`
- **Validación**: **OBLIGATORIO** - Formato internacional
- **Placeholder**: "+51987654321"
- **Formato esperado**: `+[código país][número]` (ej: +51987654321)
- **Regex validación**: `/^\+?[1-9]\d{1,14}$/`
- **Mensaje de error**: "Por favor ingresa un número de WhatsApp válido con código de país (ej: +51987654321)"
- **Notas**: Campo obligatorio para comunicación

#### Pregunta 6: Instagram

- **Texto de la pregunta**: "¿Cuál es el Instagram de tu negocio? Haremos un estudio de tu marca. Copiar el link del negocio."
- **Tipo de campo**: URL Input
- **Campo Airtable**: `Instagram del negocio`
- **Validación**: Opcional - URL válida de Instagram
- **Placeholder**: "https://www.instagram.com/migraflix/"
- **Ejemplo**: "https://www.instagram.com/migraflix/"
- **Validación regex**: Debe contener `instagram.com` o ser URL válida
- **Mensaje de error**: "Por favor ingresa un link válido de Instagram (ej: https://www.instagram.com/migraflix/)"
- **Notas**: Se usará para estudio de marca y generación de contenido

#### Pregunta 7: Historia del Negocio

- **Texto de la pregunta**: "Cuéntanos brevemente sobre tu negocio! Aprovecharemos esta historia para generar posts persuasivos."
- **Tipo de campo**: Textarea (múltiples líneas)
- **Campo Airtable**: `Historia Emprendedor`
- **Validación**: Opcional
- **Placeholder**: "Ej: Cuando llegué a Lima, empecé haciendo arepas en casa y hoy lidero Sabores de Venezuela, un proyecto que comparte el sabor y la alegría de la gastronomía venezolana con los limeños. Los platos estrella son la arepa reina pepiada y el pabellón criollo. Todos los pedidos se hacen con 24 horas de anticipación y me aseguro de entregarlos yo mismo en las casas de mis clientes para presentar los platos."
- **Límite de caracteres**: 1000 caracteres (recomendado)
- **Notas**: Texto usado para generar posts persuasivos y contenido personalizado

### Tabla Resumen de Campos

| #   | Pregunta                              | Campo Airtable                          | Tipo     | Validación       | Obligatorio | Notas                                      |
| --- | ------------------------------------- | --------------------------------------- | -------- | ---------------- | ----------- | ------------------------------------------ |
| 1   | ¿Cómo te llamas?                      | `Emprendedor`                           | Text     | Opcional         | ❌          | Nombre del dueño/contacto                  |
| 2   | ¿Cuál es el nombre de tu negocio?     | `Negocio`                               | Text     | Min 2 chars      | ✅          | Ya existe en la tabla                      |
| 3   | ¿En qué ciudad queda tu negocio?      | `Ciudad`                                | Text     | Opcional         | ❌          | Determina idioma y características locales |
| 4   | ¿En qué país queda tu negocio?        | `País`                                  | Select   | Opcional         | ❌          | Determina idioma y características locales |
| 5   | ¿Cuál es el WhatsApp de tu negocio?   | `Call to Action (Whatsapp del negocio)` | Tel      | Regex validación | ✅          | Formato: +1234567890                       |
| 6   | ¿Cuál es el Instagram de tu negocio?  | `Instagram del negocio`                 | URL      | URL válida       | ❌          | Validar formato URL de Instagram           |
| 7   | Cuéntanos brevemente sobre tu negocio | `Historia Emprendedor`                  | Textarea | Opcional         | ❌          | Texto largo para generar posts             |

### Mapeo de Campos Airtable

#### Campos Existentes Identificados (Verificar en Airtable)

- ✅ `Negocio` - Ya existe, campo de texto
- ✅ `Emprendedor` - Ya existe, campo de texto (nombre del contacto)
- ✅ `Ciudad` - Ya existe, campo de texto
- ✅ `País` - Ya existe, campo de texto o select
- ✅ `Idioma` / `Language` - Ya existe, se puede inferir del país
- ✅ `Call to Action (Whatsapp del negocio)` - Ya existe, campo de texto/teléfono
- ✅ `Instagram del negocio` - Ya existe, campo de URL o texto
- ✅ `Historia Emprendedor` - Ya existe, campo de texto largo
- ✅ `Upload Fotos Link` - Ya existe, se generará después del registro

#### Campos a Verificar en Airtable

- ⚠️ Verificar nombres exactos de todos los campos mencionados
- ⚠️ Verificar tipos de campo (text, phone, url, long text)
- ⚠️ Verificar si `Idioma` se puede escribir automáticamente

#### Función de Inferencia de Idioma

```typescript
function inferLanguage(pais: string, ciudad?: string): string {
  const languageMap: Record<string, string> = {
    Perú: "es",
    Colombia: "es",
    Chile: "es",
    Argentina: "es",
    México: "es",
    España: "es",
    "Estados Unidos": "en",
    Brasil: "pt",
    // ... más países
  };

  return languageMap[pais] || "es"; // Default español
}
```

#### Mapeo Completo de Datos

```typescript
interface BrandFormData {
  nombreContacto?: string;
  negocio: string; // Obligatorio
  ciudad?: string;
  pais?: string;
  whatsapp: string; // Obligatorio
  instagram?: string;
  descripcion?: string;
}

function mapToAirtableFields(formData: BrandFormData) {
  const fields: Record<string, any> = {
    Negocio: formData.negocio,
    "Call to Action (Whatsapp del negocio)": formData.whatsapp,
  };

  // Campos opcionales
  if (formData.nombreContacto) {
    fields["Emprendedor"] = formData.nombreContacto;
  }

  if (formData.ciudad) {
    fields["Ciudad"] = formData.ciudad;
  }

  if (formData.pais) {
    fields["País"] = formData.pais;
    // Inferir idioma automáticamente
    fields["Idioma"] = inferLanguage(formData.pais, formData.ciudad);
  }

  if (formData.instagram) {
    fields["Instagram del negocio"] = formData.instagram;
  }

  if (formData.descripcion) {
    fields["Historia Emprendedor"] = formData.descripcion;
  }

  // Generar link único para subida de fotos
  // Este link se generará después de crear el registro
  // fields["Upload Fotos Link"] = `${process.env.NEXT_PUBLIC_URL}/registro/fotos/${recordId}`;

  return fields;
}
```

---

## 🎨 Diseño y UX

### Principios de Diseño

1. **Simplicidad**: Interfaz limpia sin distracciones
2. **Claridad**: Una pregunta a la vez, fácil de entender
3. **Progreso visible**: El usuario siempre sabe dónde está
4. **Feedback inmediato**: Validación en tiempo real
5. **Accesibilidad**: Cumplir con WCAG 2.1 AA

### Características Principales

#### 1. Una Pregunta a la Vez

- **Implementación**: Mostrar solo una pregunta en pantalla
- **Transiciones**:
  - Fade out de pregunta anterior (300ms)
  - Fade in de pregunta siguiente (300ms)
  - Slide horizontal opcional para mejor UX
- **Animaciones**: Usar CSS transitions o Framer Motion

#### 2. Indicador de Progreso

**Ubicación**: Parte superior de la pantalla, fijo

**Componentes**:

- Barra de progreso visual (0-100%)
- Contador de preguntas: "Pregunta 2 de 7"
- Porcentaje: "29% completado" (opcional)

**Diseño**:

```
[████████░░░░░░░░░░░░] 29%
Pregunta 2 de 7
```

#### 3. Navegación

**Botones**:

- **"Siguiente"** (primario): Avanzar a siguiente pregunta
- **"Atrás"** (secundario): Retroceder (no disponible en pregunta 1)
- **"Enviar"** (primario): Última pregunta, envía formulario

**Comportamiento**:

- Validación antes de avanzar
- Enter para avanzar (si validación pasa)
- Deshabilitar botón "Siguiente" si hay errores
- Mostrar spinner en botón durante envío

#### 4. Diseño Visual

**Layout**:

- Contenedor centrado, máximo 700px de ancho
- Padding generoso (32px mobile, 48px desktop)
- Espaciado vertical entre elementos (24px)

**Tipografía**:

- Pregunta: 28px-32px, font-weight: 600
- Placeholder: 16px, color: muted
- Input: 18px-20px para mejor legibilidad
- Botones: 16px, padding: 12px 24px

**Colores**:

- Fondo: `bg-background` (modo claro/oscuro)
- Pregunta: `text-foreground`
- Input: `border-input`, focus: `ring-primary`
- Botón primario: `bg-primary`, hover: `bg-primary/90`
- Error: `text-destructive`

**Campos de Entrada**:

- Altura mínima: 48px (touch-friendly)
- Border radius: 8px
- Focus ring: 2px, color primary
- Placeholder con ejemplos claros

#### 5. Feedback Visual

**Indicadores de Campos Obligatorios**:

- Asterisco (\*) en color primary o destructive
- Texto "(Opcional)" para campos no obligatorios

**Mensajes de Error**:

- Mostrar debajo del campo
- Color: destructive
- Icono de error (opcional)
- Mensaje claro y accionable

**Estados**:

- **Normal**: Campo vacío, placeholder visible
- **Focus**: Ring de color primary
- **Error**: Border rojo, mensaje de error visible
- **Success**: Border verde (opcional, después de validar)
- **Loading**: Spinner en botón, deshabilitar inputs
- **Success Submit**: Animación de check, redirección

**Animaciones**:

- Transición entre preguntas: 300ms ease-in-out
- Aparecer mensajes de error: 200ms fade-in
- Botón hover: scale 1.02
- Botón click: scale 0.98

#### 6. Responsive Design

**Mobile (< 640px)**:

- Una pregunta por pantalla
- Botones full-width
- Inputs full-width
- Padding reducido (24px)
- Tipografía: 24px para preguntas

**Tablet (640px - 1024px)**:

- Mismo diseño que mobile
- Más espacio horizontal
- Padding: 32px

**Desktop (> 1024px)**:

- Contenedor centrado, 700px máximo
- Padding: 48px
- Tipografía: 32px para preguntas

---

## 🏗️ Arquitectura Técnica

### Estructura de Archivos

```
app/
  registro/
    page.tsx                    # Página principal del formulario
    [step]/
      page.tsx                   # Página dinámica por paso (opcional)
  api/
    brands/
      route.ts                   # GET existente
      route.ts                   # POST nuevo para crear marca
```

### Componentes Necesarios

```
components/
  forms/
    brand-registration-form.tsx  # Componente principal del formulario
    question-step.tsx            # Componente para cada pregunta
    progress-bar.tsx             # Barra de progreso
    form-navigation.tsx          # Botones de navegación
```

### Tecnologías a Usar

- **React Hook Form**: Manejo de formularios
- **Zod**: Validación de esquemas
- **shadcn/ui**: Componentes UI (Input, Textarea, Button, Card, Label, Select)
- **Framer Motion** (opcional): Animaciones suaves
- **Next.js App Router**: Routing y API routes

---

## 📦 Implementación Paso a Paso

### Fase 1: Configuración Inicial

1. **Crear API Route para crear marca**

   - `app/api/brands/route.ts` (agregar método POST)
   - Validar campos obligatorios
   - Crear registro en Airtable
   - Retornar recordId del nuevo registro

2. **Definir esquema de validación (Zod)**
   ```typescript
   const brandRegistrationSchema = z.object({
     nombreContacto: z.string().optional(),
     negocio: z.string().min(1, "El nombre del negocio es obligatorio"),
     ciudad: z.string().optional(),
     pais: z.string().optional(),
     whatsapp: z
       .string()
       .regex(/^\+?[1-9]\d{1,14}$/, "Formato de WhatsApp inválido"),
     instagram: z.string().url().optional().or(z.literal("")),
     descripcion: z.string().optional(),
   });
   ```

### Fase 2: Componentes del Formulario

3. **Crear componente de progreso**

   - Barra visual de progreso
   - Contador de preguntas
   - Porcentaje

4. **Crear componente de pregunta individual**

   - Input/Textarea/Select según tipo
   - Label con pregunta
   - Placeholder con ejemplo
   - Validación en tiempo real

5. **Crear formulario principal**
   - Manejo de estado con React Hook Form
   - Navegación entre preguntas
   - Animaciones de transición
   - Validación por paso

### Fase 3: Integración con Airtable

6. **Mapear campos del formulario a Airtable**

   ```typescript
   const mapToAirtableFields = (formData) => ({
     Negocio: formData.negocio,
     Ciudad: formData.ciudad,
     País: formData.pais,
     WhatsApp: formData.whatsapp,
     Instagram: formData.instagram,
     Description: formData.descripcion,
     "Nombre Contacto": formData.nombreContacto,
     // Inferir idioma basado en país
     Idioma: inferLanguage(formData.pais),
   });
   ```

7. **Manejo de errores y éxito**
   - Mostrar errores de API
   - Redirigir a formulario 2 después del éxito
   - Guardar recordId en estado/sesión para formulario 2

### Fase 4: Formulario 2 (Subida de Fotos)

8. **Preparar estructura básica**
   - Página de subida de fotos
   - Recibir recordId del formulario 1
   - Diseño similar (estilo Typeform)
   - **Nota**: Detalles específicos a revisar después

---

## 🔄 Flujo de Usuario

```
1. Usuario accede a /registro
   ↓
2. Ve pregunta 1: "¿Cómo te llamas?"
   ↓
3. Completa y presiona "Siguiente"
   ↓
4. Ve pregunta 2: "¿Cuál es el nombre de tu negocio?" *
   ↓
5. Completa (obligatorio) y presiona "Siguiente"
   ↓
6. ... continúa con todas las preguntas
   ↓
7. Al completar pregunta 7, presiona "Enviar"
   ↓
8. Se muestra estado de carga
   ↓
9. Se crea registro en Airtable
   ↓
10. Redirige a /registro/fotos/[recordId] (formulario 2)
```

---

## 🎯 Validaciones Específicas

### Campo: WhatsApp

- Formato: Número internacional (ej: +51987654321)
- Validar con regex: `/^\+?[1-9]\d{1,14}$/`
- Mensaje de error: "Por favor ingresa un número de WhatsApp válido con código de país"

### Campo: Instagram

- Validar que sea URL válida
- Opcional: Validar que sea URL de Instagram
- Mensaje de error: "Por favor ingresa un link válido de Instagram (ej: https://www.instagram.com/migraflix/)"

### Campo: Negocio

- Obligatorio
- Mínimo 2 caracteres
- Mensaje de error: "El nombre del negocio es obligatorio"

---

## 📱 Responsive Design

- **Mobile**: Una pregunta por pantalla, botones full-width
- **Tablet**: Mismo diseño, más espacio
- **Desktop**: Contenedor centrado, máximo 600px de ancho

---

## 🚀 Plan de Implementación - Timeline

### Fase 1: Preparación y Configuración (2-3 días)

- [ ] **Día 1**: Verificar nombres exactos de columnas en Airtable

  - [ ] Conectar con Airtable API
  - [ ] Listar todos los campos de la tabla Brands
  - [ ] Documentar campos existentes vs nuevos necesarios
  - [ ] Crear campos nuevos en Airtable si es necesario

- [ ] **Día 2**: Configuración técnica
  - [ ] Crear API route POST `/api/brands` para crear marca
  - [ ] Definir esquema de validación con Zod
  - [ ] Configurar función de inferencia de idioma
  - [ ] Crear tipos TypeScript para formulario

### Fase 2: Componentes Base (3-4 días)

- [ ] **Día 3**: Componentes de UI base

  - [ ] Crear componente `ProgressBar`
  - [ ] Crear componente `QuestionStep` (wrapper genérico)
  - [ ] Crear componente `FormNavigation` (botones)
  - [ ] Configurar animaciones básicas

- [ ] **Día 4**: Componentes de preguntas específicas
  - [ ] Componente para pregunta de texto
  - [ ] Componente para pregunta de teléfono (WhatsApp)
  - [ ] Componente para pregunta de URL (Instagram)
  - [ ] Componente para textarea (historia)
  - [ ] Componente para select (país)

### Fase 3: Formulario Principal (3-4 días)

- [ ] **Día 5-6**: Lógica del formulario

  - [ ] Integrar React Hook Form
  - [ ] Implementar navegación entre preguntas
  - [ ] Validación por paso
  - [ ] Manejo de estado del formulario

- [ ] **Día 7**: Integración con Airtable
  - [ ] Mapear datos del formulario a Airtable
  - [ ] Manejo de errores de API
  - [ ] Generar link único para formulario 2
  - [ ] Redirección después del éxito

### Fase 4: Testing y Refinamiento (2-3 días)

- [ ] **Día 8**: Testing funcional

  - [ ] Probar todos los campos
  - [ ] Validar todas las validaciones
  - [ ] Probar flujo completo
  - [ ] Testing en diferentes dispositivos

- [ ] **Día 9**: Ajustes y mejoras
  - [ ] Ajustar animaciones
  - [ ] Mejorar mensajes de error
  - [ ] Optimizar rendimiento
  - [ ] Ajustes de diseño según feedback

### Fase 5: Formulario 2 (A definir)

- [ ] Revisar especificaciones del Formulario 2
- [ ] Implementar subida de fotos
- [ ] Integrar con Airtable
- [ ] Testing completo

**Total estimado**: 10-14 días para Formulario 1 completo

---

## 📝 Notas Importantes y Consideraciones

### Funcionalidades Clave

- **Idioma Automático**: Determinar automáticamente basado en país/ciudad

  - Mapeo país → idioma (Perú → español, Brasil → portugués, etc.)
  - Guardar en campo `Idioma` o `Language` en Airtable

- **Upload Fotos Link**:

  - Se generará después de crear el registro en Formulario 1
  - Formato: `${BASE_URL}/registro/fotos/${recordId}`
  - Guardar en campo `Upload Fotos Link` en Airtable
  - Este link se puede compartir con el usuario

- **Validación Robusta**:

  - Todos los campos obligatorios deben validarse antes de avanzar
  - Validación en tiempo real (onBlur o onChange)
  - Mensajes de error claros y accionables
  - No permitir avanzar si hay errores

- **Experiencia de Usuario**:
  - Priorizar UX fluida similar a Typeform
  - Animaciones suaves pero no excesivas
  - Feedback inmediato en cada acción
  - Diseño accesible (WCAG 2.1 AA)

### Casos Edge a Considerar

1. **Usuario cierra el navegador a mitad del formulario**

   - Opción: Guardar progreso en localStorage
   - Opción: Permitir continuar desde donde se quedó

2. **Error de conexión al enviar**

   - Mostrar mensaje de error claro
   - Permitir reintentar
   - No perder datos del formulario

3. **Usuario ingresa datos inválidos**

   - Validación en tiempo real
   - Mensajes de error específicos
   - Ejemplos claros de formato esperado

4. **País no está en la lista**

   - Permitir entrada manual o
   - Agregar opción "Otro" con campo de texto

5. **WhatsApp sin código de país**
   - Intentar detectar código basado en país seleccionado
   - Sugerir formato correcto
   - Validar antes de avanzar

### Seguridad y Privacidad

- **Validación en servidor**: No confiar solo en validación del cliente
- **Sanitización**: Limpiar inputs antes de guardar en Airtable
- **Rate limiting**: Prevenir spam de registros
- **Datos sensibles**: WhatsApp es información sensible, manejar con cuidado

### Performance

- **Lazy loading**: Cargar componentes de preguntas bajo demanda
- **Optimización de imágenes**: Si hay imágenes en el diseño
- **Bundle size**: Mantener dependencias al mínimo
- **Caching**: Cachear lista de países si viene de API externa

---

## 🔍 Checklist de Verificación en Airtable

### Antes de Implementar

**Verificar nombres exactos de columnas en la tabla `tblJGkhNnljbmZkrr` (Brands):**

- [ ] **Contacto**: Verificar si existe `Nombre Contacto`, `Contact Name`, o similar
- [ ] **Ciudad**: Verificar si usar `Location`, `Ciudad`, `City`, o crear nuevo campo
- [ ] **WhatsApp**: Verificar si existe campo, tipo de campo (texto/teléfono)
- [ ] **Instagram**: Verificar si existe campo, tipo de campo (URL/texto)
- [ ] **Descripción**: Verificar nombre exacto: `Description`, `Historia`, `Story`, etc.
- [ ] **Idioma**: Verificar si es `Idioma`, `Language`, y si se puede escribir automáticamente
- [ ] **Upload Fotos Link**: Verificar nombre exacto del campo existente

**Crear campos nuevos si no existen:**

- [ ] Crear campo `Nombre Contacto` (tipo: Single line text)
- [ ] Crear campo `Ciudad` si no se usa Location (tipo: Single line text)
- [ ] Crear campo `WhatsApp` (tipo: Phone number o Single line text)
- [ ] Crear campo `Instagram` (tipo: URL o Single line text)

**Verificar permisos:**

- [ ] API Key tiene permisos de escritura en la tabla Brands
- [ ] Verificar límites de rate de Airtable API
- [ ] Probar creación de registro de prueba

### Durante la Implementación

- [ ] Probar mapeo de cada campo individualmente
- [ ] Verificar que los datos se guardan correctamente
- [ ] Verificar formato de datos (especialmente WhatsApp e Instagram)
- [ ] Probar inferencia de idioma
- [ ] Verificar generación de link de fotos

### Después de Implementar

- [ ] Crear registro de prueba completo
- [ ] Verificar todos los campos en Airtable
- [ ] Verificar que el link de fotos se genera correctamente
- [ ] Probar flujo completo end-to-end

---

## 🧪 Testing y Validación

### Casos de Prueba

#### Formulario 1 - Casos de Prueba

1. **Flujo Happy Path**

   - [ ] Completar todas las preguntas correctamente
   - [ ] Verificar que se crea registro en Airtable
   - [ ] Verificar que se genera link de fotos
   - [ ] Verificar redirección a formulario 2

2. **Validaciones Obligatorias**

   - [ ] Intentar avanzar sin nombre de negocio → debe mostrar error
   - [ ] Intentar avanzar sin WhatsApp → debe mostrar error
   - [ ] Verificar que campos opcionales permiten avanzar vacíos

3. **Validaciones de Formato**

   - [ ] WhatsApp sin código de país → error
   - [ ] WhatsApp con formato incorrecto → error
   - [ ] Instagram con URL inválida → error
   - [ ] Instagram con URL válida → éxito

4. **Navegación**

   - [ ] Botón "Atrás" funciona correctamente
   - [ ] Botón "Atrás" no aparece en primera pregunta
   - [ ] Enter avanza si validación pasa
   - [ ] Enter no avanza si hay errores

5. **Estados y Feedback**

   - [ ] Mostrar loading durante envío
   - [ ] Mostrar error si falla API
   - [ ] Mostrar éxito y redirigir
   - [ ] Progreso se actualiza correctamente

6. **Responsive**

   - [ ] Funciona en mobile (< 640px)
   - [ ] Funciona en tablet (640-1024px)
   - [ ] Funciona en desktop (> 1024px)
   - [ ] Inputs son touch-friendly en mobile

7. **Edge Cases**
   - [ ] Usuario cierra y vuelve (localStorage)
   - [ ] Error de conexión durante envío
   - [ ] País no está en lista
   - [ ] Texto muy largo en descripción

### Métricas de Éxito

- **Tasa de completación**: > 80% de usuarios completan el formulario
- **Tiempo promedio**: < 3 minutos para completar
- **Errores de validación**: < 5% de intentos fallidos
- **Tasa de error de API**: < 1% de envíos fallidos

## 📚 Referencias y Recursos

### Documentación Técnica

- [React Hook Form](https://react-hook-form.com/) - Manejo de formularios
- [Zod](https://zod.dev/) - Validación de esquemas TypeScript
- [Airtable API](https://airtable.com/developers/web/api/create-records) - Documentación de API
- [shadcn/ui Components](https://ui.shadcn.com/) - Componentes UI
- [Framer Motion](https://www.framer.com/motion/) - Animaciones (opcional)

### Inspiración de Diseño

- [Typeform](https://www.typeform.com/) - Referencia de UX
- [Form Design Patterns](https://www.smashingmagazine.com/2018/08/ux-html5-form-validation/) - Patrones de formularios

### Accesibilidad

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/) - Recursos de accesibilidad web

## 📋 Resumen Ejecutivo para Stakeholders

**Objetivo**: Crear sistema de registro de restaurantes con experiencia moderna

**Alcance**:

- Formulario 1: 7 preguntas sobre el restaurante
- Formulario 2: Subida de fotos (a definir)
- Integración completa con Airtable

**Timeline**: 10-14 días para Formulario 1

**Tecnologías**: Next.js, React Hook Form, Zod, shadcn/ui, Airtable API

**Entregables**:

- Formulario funcional y responsive
- Integración con Airtable
- Validaciones robustas
- Experiencia de usuario fluida

---

## 🚀 PLAN DE ACCIÓN COMPLETO - IMPLEMENTACIÓN

### FASE 0: Preparación y Configuración (Día 1-2)

#### Tarea 0.1: Verificación de Airtable

- [ ] Conectar con Airtable API usando credenciales existentes
- [ ] Listar todos los campos de la tabla `tblJGkhNnljbmZkrr` (Brands)
- [ ] Documentar nombres exactos de campos:
  - [ ] `Emprendedor`
  - [ ] `Negocio`
  - [ ] `Ciudad`
  - [ ] `País`
  - [ ] `Call to Action (Whatsapp del negocio)`
  - [ ] `Instagram del negocio`
  - [ ] `Historia Emprendedor`
  - [ ] `Idioma` / `Language`
  - [ ] `Upload Fotos Link`
- [ ] Verificar tipos de campo en Airtable
- [ ] Verificar permisos de escritura de API Key
- [ ] Probar creación de registro de prueba

#### Tarea 0.2: Configuración del Proyecto

- [ ] Verificar dependencias en `package.json`:
  - [ ] `react-hook-form` ✅ (ya existe)
  - [ ] `@hookform/resolvers` ✅ (ya existe)
  - [ ] `zod` ✅ (ya existe)
  - [ ] `framer-motion` (instalar si se usa para animaciones)
- [ ] Crear estructura de carpetas:
  ```
  app/
    registro/
      page.tsx
      fotos/
        [recordId]/
          page.tsx
  components/
    forms/
      brand-registration-form.tsx
      question-step.tsx
      progress-bar.tsx
      form-navigation.tsx
  lib/
    airtable/
      brands.ts
      utils.ts
    validation/
      brand-schema.ts
  ```

#### Tarea 0.3: Definir Esquema de Validación

- [ ] Crear archivo `lib/validation/brand-schema.ts`
- [ ] Definir esquema Zod con todas las validaciones
- [ ] Crear tipos TypeScript para el formulario
- [ ] Definir función de inferencia de idioma

---

### FASE 1: API y Backend (Día 3-4)

#### Tarea 1.1: Crear API Route POST para Brands

- [ ] Modificar `app/api/brands/route.ts`
- [ ] Agregar método POST
- [ ] Implementar validación de datos en servidor
- [ ] Implementar mapeo de campos a Airtable
- [ ] Implementar creación de registro
- [ ] Generar link único para formulario 2
- [ ] Actualizar campo `Upload Fotos Link` en Airtable
- [ ] Manejo de errores robusto
- [ ] Retornar recordId del nuevo registro

**Código de referencia:**

```typescript
// app/api/brands/route.ts
export async function POST(request: NextRequest) {
  // 1. Validar datos recibidos
  // 2. Mapear a campos de Airtable
  // 3. Crear registro en Airtable
  // 4. Generar link de fotos
  // 5. Actualizar campo Upload Fotos Link
  // 6. Retornar recordId
}
```

#### Tarea 1.2: Utilidades de Airtable

- [ ] Crear `lib/airtable/brands.ts` con funciones:
  - [ ] `createBrand(fields)` - Crear nuevo registro
  - [ ] `mapFormDataToAirtable(formData)` - Mapear datos
  - [ ] `inferLanguage(pais, ciudad)` - Inferir idioma
- [ ] Crear `lib/airtable/utils.ts` con funciones auxiliares
- [ ] Manejo de errores de API
- [ ] Logging para debugging

---

### FASE 2: Componentes Base (Día 5-6)

#### Tarea 2.1: Componente ProgressBar

- [ ] Crear `components/forms/progress-bar.tsx`
- [ ] Implementar barra de progreso visual
- [ ] Mostrar porcentaje completado
- [ ] Mostrar contador "Pregunta X de 7"
- [ ] Estilos responsive
- [ ] Animación suave al cambiar progreso

#### Tarea 2.2: Componente QuestionStep

- [ ] Crear `components/forms/question-step.tsx`
- [ ] Wrapper genérico para cada pregunta
- [ ] Manejo de animaciones (fade in/out)
- [ ] Layout consistente
- [ ] Integración con React Hook Form

#### Tarea 2.3: Componente FormNavigation

- [ ] Crear `components/forms/form-navigation.tsx`
- [ ] Botón "Siguiente" (primario)
- [ ] Botón "Atrás" (secundario, condicional)
- [ ] Botón "Enviar" (última pregunta)
- [ ] Estados de loading
- [ ] Deshabilitar botones según validación
- [ ] Manejo de tecla Enter

---

### FASE 3: Componentes de Preguntas (Día 7-8)

#### Tarea 3.1: Pregunta 1 - Nombre del Contacto

- [ ] Crear componente para input de texto
- [ ] Integrar con React Hook Form
- [ ] Placeholder: "Ej: Juan Pérez"
- [ ] Validación opcional
- [ ] Estilos consistentes

#### Tarea 3.2: Pregunta 2 - Nombre del Negocio

- [ ] Crear componente para input de texto
- [ ] Validación obligatoria (min 2 caracteres)
- [ ] Placeholder: "Ej: Sabores de Venezuela"
- [ ] Mensaje de error claro
- [ ] Indicador de campo obligatorio (\*)

#### Tarea 3.3: Pregunta 3 - Ciudad

- [ ] Crear componente para input de texto
- [ ] Opcional: autocompletado de ciudades
- [ ] Placeholder: "Ej: Lima"
- [ ] Validación opcional

#### Tarea 3.4: Pregunta 4 - País

- [ ] Crear componente Select/Dropdown
- [ ] Lista de países (Perú, Colombia, Chile, etc.)
- [ ] Opción "Otro" con input de texto
- [ ] Validación opcional
- [ ] Pre-llenar idioma basado en selección

#### Tarea 3.5: Pregunta 5 - WhatsApp

- [ ] Crear componente para input de teléfono
- [ ] Validación obligatoria con regex
- [ ] Placeholder: "+51987654321"
- [ ] Formato automático (opcional)
- [ ] Mensaje de error específico
- [ ] Indicador de campo obligatorio (\*)

#### Tarea 3.6: Pregunta 6 - Instagram

- [ ] Crear componente para input de URL
- [ ] Validación de URL de Instagram
- [ ] Placeholder: "https://www.instagram.com/migraflix/"
- [ ] Validación opcional pero con formato correcto
- [ ] Mensaje de error con ejemplo

#### Tarea 3.7: Pregunta 7 - Historia del Negocio

- [ ] Crear componente Textarea
- [ ] Múltiples líneas
- [ ] Placeholder con ejemplo completo
- [ ] Límite de caracteres (1000, mostrar contador)
- [ ] Validación opcional
- [ ] Estilos para texto largo

---

### FASE 4: Formulario Principal (Día 9-10)

#### Tarea 4.1: Integración de React Hook Form

- [ ] Crear `components/forms/brand-registration-form.tsx`
- [ ] Configurar React Hook Form con esquema Zod
- [ ] Definir estado del formulario
- [ ] Manejo de navegación entre preguntas
- [ ] Validación por paso
- [ ] Guardar progreso en localStorage (opcional)

#### Tarea 4.2: Lógica de Navegación

- [ ] Estado para pregunta actual (1-7)
- [ ] Función `nextStep()` con validación
- [ ] Función `prevStep()` para retroceder
- [ ] Deshabilitar "Atrás" en primera pregunta
- [ ] Cambiar botón "Siguiente" a "Enviar" en última pregunta

#### Tarea 4.3: Animaciones y Transiciones

- [ ] Implementar fade in/out entre preguntas
- [ ] Duración: 300ms
- [ ] Easing: ease-in-out
- [ ] Usar CSS transitions o Framer Motion
- [ ] Asegurar que no hay saltos visuales

#### Tarea 4.4: Manejo de Envío

- [ ] Función `handleSubmit()`
- [ ] Validar todos los campos antes de enviar
- [ ] Mostrar estado de loading
- [ ] Llamar a API `/api/brands` (POST)
- [ ] Manejo de errores de API
- [ ] Redirección a formulario 2 después del éxito
- [ ] Pasar recordId en la URL

---

### FASE 5: Página Principal del Formulario (Día 11)

#### Tarea 5.1: Crear Página de Registro

- [ ] Crear `app/registro/page.tsx`
- [ ] Integrar componente `BrandRegistrationForm`
- [ ] Layout responsive
- [ ] Estilos consistentes con el resto de la app
- [ ] Manejo de errores globales

#### Tarea 5.2: Estilos y Diseño

- [ ] Aplicar estilos según especificaciones
- [ ] Contenedor centrado (max 700px)
- [ ] Padding generoso
- [ ] Tipografía grande y legible
- [ ] Colores según tema (claro/oscuro)
- [ ] Responsive (mobile-first)

---

### FASE 6: Testing y Refinamiento (Día 12-13)

#### Tarea 6.1: Testing Funcional

- [ ] Probar todas las preguntas individualmente
- [ ] Probar validaciones obligatorias
- [ ] Probar validaciones de formato (WhatsApp, Instagram)
- [ ] Probar navegación (Siguiente, Atrás)
- [ ] Probar envío completo del formulario
- [ ] Verificar creación en Airtable
- [ ] Verificar generación de link de fotos

#### Tarea 6.2: Testing de Casos Edge

- [ ] Usuario cierra y vuelve (localStorage)
- [ ] Error de conexión durante envío
- [ ] País no está en lista
- [ ] WhatsApp sin código de país
- [ ] Instagram con formato incorrecto
- [ ] Texto muy largo en descripción

#### Tarea 6.3: Testing Responsive

- [ ] Probar en mobile (< 640px)
- [ ] Probar en tablet (640-1024px)
- [ ] Probar en desktop (> 1024px)
- [ ] Verificar que inputs son touch-friendly
- [ ] Verificar que botones son accesibles

#### Tarea 6.4: Ajustes y Mejoras

- [ ] Ajustar animaciones si es necesario
- [ ] Mejorar mensajes de error
- [ ] Optimizar rendimiento
- [ ] Ajustar estilos según feedback
- [ ] Verificar accesibilidad (WCAG 2.1 AA)

---

### FASE 7: Formulario 2 - Subida de Fotos (Día 14+)

#### Tarea 7.1: Preparación

- [ ] Revisar especificaciones del Formulario 2
- [ ] Definir estructura de datos para fotos
- [ ] Verificar campo en Airtable para almacenar fotos
- [ ] Decidir método de subida (directo a Airtable o servidor intermedio)

#### Tarea 7.2: Implementación Básica

- [ ] Crear `app/registro/fotos/[recordId]/page.tsx`
- [ ] Recibir recordId de la URL
- [ ] Verificar que el registro existe
- [ ] Diseño similar al Formulario 1 (estilo Typeform)

#### Tarea 7.3: Componente de Subida

- [ ] Crear componente de drag & drop
- [ ] Permitir múltiples imágenes
- [ ] Validar formato de archivo (jpg, png, etc.)
- [ ] Validar tamaño de archivo
- [ ] Preview de imágenes antes de subir
- [ ] Indicador de progreso de subida

#### Tarea 7.4: Integración con Airtable

- [ ] Crear API route para subir fotos
- [ ] Subir imágenes a Airtable (campo Attachment)
- [ ] Asociar fotos al registro del restaurante
- [ ] Manejo de errores
- [ ] Confirmación de éxito

#### Tarea 7.5: Testing Formulario 2

- [ ] Probar subida de una foto
- [ ] Probar subida de múltiples fotos
- [ ] Probar con diferentes formatos
- [ ] Probar con archivos muy grandes
- [ ] Verificar que se guardan en Airtable

---

### CHECKLIST FINAL DE ENTREGABLES

#### Formulario 1 - Registro del Restaurante

- [ ] ✅ 7 preguntas implementadas correctamente
- [ ] ✅ Validaciones funcionando (obligatorias y formato)
- [ ] ✅ Navegación entre preguntas fluida
- [ ] ✅ Animaciones suaves
- [ ] ✅ Barra de progreso visible
- [ ] ✅ Integración con Airtable funcionando
- [ ] ✅ Generación de link de fotos
- [ ] ✅ Responsive en todos los dispositivos
- [ ] ✅ Manejo de errores robusto
- [ ] ✅ Testing completo

#### Formulario 2 - Subida de Fotos

- [ ] ✅ Página de subida de fotos creada
- [ ] ✅ Componente de drag & drop funcionando
- [ ] ✅ Validación de archivos
- [ ] ✅ Preview de imágenes
- [ ] ✅ Subida a Airtable
- [ ] ✅ Asociación con registro del restaurante
- [ ] ✅ Confirmación de éxito
- [ ] ✅ Testing completo

#### Documentación

- [ ] ✅ Código comentado
- [ ] ✅ README actualizado (opcional)
- [ ] ✅ Documentación de API routes
- [ ] ✅ Guía de uso para el cliente

---

### ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. **Día 1-2**: Fase 0 (Preparación)
2. **Día 3-4**: Fase 1 (API y Backend)
3. **Día 5-6**: Fase 2 (Componentes Base)
4. **Día 7-8**: Fase 3 (Componentes de Preguntas)
5. **Día 9-10**: Fase 4 (Formulario Principal)
6. **Día 11**: Fase 5 (Página Principal)
7. **Día 12-13**: Fase 6 (Testing y Refinamiento)
8. **Día 14+**: Fase 7 (Formulario 2)

**Total estimado**: 14-16 días para implementación completa

---

### NOTAS DE IMPLEMENTACIÓN

- **Prioridad**: Completar Formulario 1 antes de Formulario 2
- **Testing continuo**: Probar cada componente mientras se desarrolla
- **Commits frecuentes**: Hacer commits pequeños y descriptivos
- **Feedback temprano**: Mostrar progreso al cliente para ajustes
- **Documentación**: Comentar código complejo
- **Performance**: Optimizar desde el inicio, no al final
