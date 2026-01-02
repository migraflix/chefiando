# QA - Correcciones del Formulario de Registro

Este documento contiene las pruebas de calidad (QA) para verificar que todas las correcciones implementadas funcionen correctamente.

## 📋 Índice de Correcciones

1. ✅ Error de caracteres escapados en "generar posts"
2. ✅ Detección automática de idioma según ubicación
3. ✅ Página de agradecimiento respeta idioma detectado
4. ✅ Países en orden alfabético
5. ✅ Botón de review siempre visible
6. ✅ Página de review respeta idioma detectado

---

## 1. Error de Caracteres Escapados en "Generar Posts"

### Objetivo
Verificar que el formulario de subida de fotos maneje correctamente caracteres especiales, saltos de línea y caracteres problemáticos sin causar errores.

### Pasos para Probar

#### Test 1: Caracteres Especiales
1. Ir a `/fotos?marca=[ID_DE_MARCA]`
2. Agregar un producto con nombre: `Test "ensalada" con 'comillas'`
3. Agregar descripción: `Descripción con caracteres especiales: @#$%^&*()`
4. Subir una foto
5. Click en "Generar Posts"
6. **Resultado esperado**: No debe dar error, debe procesar correctamente

#### Test 2: Saltos de Línea
1. En el mismo formulario, agregar otro producto
2. Nombre: `Plato con\nsaltos\nde línea`
3. Descripción con múltiples líneas:
   ```
   Línea 1
   Línea 2
   Línea 3
   ```
4. Subir foto y generar posts
5. **Resultado esperado**: Debe procesar correctamente, los saltos de línea deben manejarse apropiadamente

#### Test 3: Caracteres Unicode y Emojis
1. Agregar producto con nombre: `🍕 Pizza Italiana 🍕`
2. Descripción: `Deliciosa pizza con ingredientes frescos y sabor auténtico`
3. Subir foto y generar posts
4. **Resultado esperado**: Debe procesar sin errores

#### Test 4: Texto Vacío y Espacios
1. Agregar producto con nombre que tenga espacios al inicio/final: `  Ensalada Mixta  `
2. Descripción con múltiples espacios: `Descripción    con    espacios`
3. Subir foto y generar posts
4. **Resultado esperado**: Los espacios deben ser normalizados, no debe dar error

### Criterios de Éxito
- ✅ No se producen errores al hacer click en "Generar Posts"
- ✅ Los datos se guardan correctamente en Airtable
- ✅ Los caracteres especiales se manejan apropiadamente
- ✅ No hay errores en la consola del navegador

---

## 2. Detección Automática de Idioma Según Ubicación

### Objetivo
Verificar que el sistema detecte automáticamente el idioma correcto basado en la ubicación del usuario (navegador/timezone).

### Pasos para Probar

#### Test 1: Usuario en Argentina (Español)
1. **Limpiar localStorage** (importante para probar detección limpia):
   - Abrir DevTools (F12)
   - Ir a Application/Storage → Local Storage
   - Eliminar la clave `language`
2. Cerrar y abrir el navegador
3. Ir a la página principal `/`
4. **Resultado esperado**: 
   - El idioma debe detectarse automáticamente como **Español (ES)**
   - Todo el contenido debe aparecer en español
   - El selector de idioma debe mostrar "ES" activo

#### Test 2: Usuario en Brasil (Portugués)
1. **Simular ubicación de Brasil**:
   - Opción A: Cambiar el idioma del navegador a Portugués (pt-BR)
   - Opción B: Usar VPN o cambiar timezone a Brasil
2. Limpiar localStorage (como en Test 1)
3. Recargar la página
4. **Resultado esperado**:
   - El idioma debe detectarse automáticamente como **Portugués (PT)**
   - Todo el contenido debe aparecer en portugués
   - El selector de idioma debe mostrar "PT" activo

#### Test 3: Persistencia del Idioma
1. Después de que se detecte el idioma automáticamente
2. Cambiar manualmente el idioma usando el selector
3. Recargar la página
4. **Resultado esperado**:
   - Debe mantener el idioma seleccionado manualmente
   - No debe volver a la detección automática

#### Test 4: Primera Visita vs Visitas Posteriores
1. **Primera visita** (sin localStorage):
   - Limpiar localStorage
   - Visitar la página
   - Debe detectar idioma automáticamente
2. **Visita posterior**:
   - Recargar la página
   - Debe mantener el idioma detectado (no volver a detectar)

### Criterios de Éxito
- ✅ Detecta español para usuarios en países de habla hispana
- ✅ Detecta portugués para usuarios en Brasil
- ✅ Respeta la selección manual del usuario
- ✅ Persiste el idioma entre sesiones
- ✅ No hay "flash" de contenido en idioma incorrecto

---

## 3. Página de Agradecimiento Respeta Idioma Detectado

### Objetivo
Verificar que la página de agradecimiento después de subir fotos muestre el contenido en el idioma correcto.

### Pasos para Probar

#### Test 1: Español
1. Asegurarse de que el idioma esté en Español (ES)
2. Completar el flujo de subida de fotos
3. Llegar a la página `/fotos/gracias?marca=[ID]`
4. **Resultado esperado**:
   - Título: "¡Ya estás listo para cambiarle la cara a tu negocio!"
   - Subtítulo: "En minutos recibirás por Whatsapp los posts que ChefIAndo ha generado."
   - Botón: "Ver mi marca"
   - Todo en español

#### Test 2: Portugués
1. Cambiar idioma a Portugués (PT)
2. Completar el flujo de subida de fotos
3. Llegar a la página `/fotos/gracias?marca=[ID]`
4. **Resultado esperado**:
   - Todo el contenido debe aparecer en portugués
   - Títulos y descripciones traducidos

#### Test 3: Cambio de Idioma en la Página
1. Estar en la página de agradecimiento
2. Cambiar el idioma usando el selector
3. **Resultado esperado**:
   - El contenido debe actualizarse inmediatamente al nuevo idioma

### Criterios de Éxito
- ✅ Muestra el contenido en el idioma correcto
- ✅ Respeta el idioma detectado automáticamente
- ✅ Permite cambiar el idioma y actualiza el contenido

---

## 4. Países en Orden Alfabético

### Objetivo
Verificar que el dropdown de países esté ordenado alfabéticamente.

### Pasos para Probar

1. Ir a `/registro`
2. Hacer click en el campo "País"
3. Verificar el orden de los países en el dropdown
4. **Resultado esperado**: Los países deben aparecer en este orden:
   - Argentina
   - Brasil
   - Chile
   - Colombia
   - Ecuador
   - España
   - Estados Unidos
   - México
   - Perú
   - Venezuela
   - Otro

### Criterios de Éxito
- ✅ Los países están en orden alfabético
- ✅ "Otro" aparece al final
- ✅ El orden es consistente en todas las vistas

---

## 5. Botón de Review Siempre Visible

### Objetivo
Verificar que el botón de review esté siempre visible sin necesidad de hacer scroll horizontal.

### Pasos para Probar

#### Test 1: Tabla de Contenido de Marca
1. Ir a `/marca/ver/[ID_DE_MARCA]`
2. Ver la tabla de contenido
3. Verificar el orden de las columnas
4. **Resultado esperado**:
   - Columnas en orden: Imagen | Post | **Review** | Status
   - El botón de review debe estar visible sin scroll horizontal
   - El botón debe estar en la tercera columna (antes de Status)

#### Test 2: Tabla de Todo el Contenido
1. Ir a `/marcas` (si hay una vista de todo el contenido)
2. Verificar la tabla
3. **Resultado esperado**:
   - El botón de review debe estar visible
   - No debe requerir scroll horizontal para ver el botón

#### Test 3: Responsive (Mobile)
1. Abrir la página en un dispositivo móvil o usar DevTools para simular móvil
2. Ver la tabla de contenido
3. **Resultado esperado**:
   - El botón de review debe ser accesible
   - Si hay scroll horizontal, el botón debe estar lo más a la izquierda posible

### Criterios de Éxito
- ✅ El botón de review está visible sin scroll horizontal
- ✅ El botón está en una posición prominente (antes de Status)
- ✅ Funciona correctamente en diferentes tamaños de pantalla

---

## 6. Página de Review Respeta Idioma Detectado

### Objetivo
Verificar que la página de review muestre el contenido en el idioma correcto.

### Pasos para Probar

#### Test 1: Español
1. Asegurarse de que el idioma esté en Español (ES)
2. Ir a una página de review: `/review/[RECORD_ID]`
3. **Resultado esperado**:
   - Título: "Avaliação de Conteúdo" (si está en español, debe ser "Evaluación de Contenido")
   - Todos los campos y botones en español
   - Placeholders en español

#### Test 2: Portugués
1. Cambiar idioma a Portugués (PT)
2. Ir a la misma página de review
3. **Resultado esperado**:
   - Todo el contenido en portugués
   - Títulos y descripciones traducidos

#### Test 3: Cambio de Idioma en la Página
1. Estar en la página de review
2. Cambiar el idioma usando el selector
3. **Resultado esperado**:
   - El contenido debe actualizarse inmediatamente
   - Todos los textos deben cambiar al nuevo idioma

### Criterios de Éxito
- ✅ Muestra el contenido en el idioma correcto
- ✅ Respeta el idioma detectado automáticamente
- ✅ Permite cambiar el idioma y actualiza el contenido
- ✅ Todos los campos, botones y mensajes están traducidos

---

## 🔍 Checklist General de QA

### Antes de Empezar
- [ ] Limpiar localStorage del navegador (para probar detección de idioma)
- [ ] Tener al menos una marca de prueba en Airtable
- [ ] Tener al menos un registro de contenido para review

### Flujo Completo de Prueba
1. [ ] Probar detección de idioma (limpiar localStorage primero)
2. [ ] Probar formulario de registro con países ordenados
3. [ ] Probar subida de fotos con caracteres especiales
4. [ ] Probar página de agradecimiento en ambos idiomas
5. [ ] Probar página de review en ambos idiomas
6. [ ] Probar visibilidad del botón de review

### Errores a Verificar
- [ ] No hay errores en la consola del navegador
- [ ] No hay errores en la consola del servidor
- [ ] No hay errores de hidratación (hydration mismatch)
- [ ] No hay errores de red (404, 500, etc.)

### Compatibilidad
- [ ] Funciona en Chrome
- [ ] Funciona en Firefox
- [ ] Funciona en Safari
- [ ] Funciona en dispositivos móviles
- [ ] Funciona en tablets

---

## 📝 Notas para QA

### Cómo Limpiar localStorage
1. Abrir DevTools (F12)
2. Ir a la pestaña "Application" (Chrome) o "Storage" (Firefox)
3. Expandir "Local Storage"
4. Seleccionar el dominio del sitio
5. Buscar la clave `language` y eliminarla
6. Recargar la página

### IDs de Prueba Necesarios
- ID de una marca existente para probar `/fotos?marca=[ID]`
- ID de un registro de contenido para probar `/review/[ID]`
- ID de una marca para probar `/marca/ver/[ID]`

### Comandos Útiles en DevTools
```javascript
// Ver el idioma actual guardado
localStorage.getItem('language')

// Limpiar el idioma guardado
localStorage.removeItem('language')

// Forzar un idioma específico
localStorage.setItem('language', 'es') // o 'pt'
```

---

## 🐛 Problemas Conocidos y Soluciones

### Problema: El idioma cambia después de cargar
**Solución**: Esto puede pasar si hay un idioma guardado en localStorage. Limpiar localStorage y recargar.

### Problema: El botón de review no es visible
**Solución**: Verificar que las columnas estén en el orden correcto. El botón debe estar antes de Status.

### Problema: Error al generar posts con caracteres especiales
**Solución**: Verificar que la función `sanitizeString` esté siendo llamada correctamente en el API.

---

## ✅ Criterios de Aprobación Final

Para considerar que todas las correcciones están funcionando correctamente:

1. ✅ No hay errores al generar posts con cualquier tipo de caracteres
2. ✅ El idioma se detecta correctamente según la ubicación
3. ✅ Todas las páginas respetan el idioma detectado
4. ✅ Los países están en orden alfabético
5. ✅ El botón de review es siempre visible
6. ✅ No hay errores en consola
7. ✅ Funciona en diferentes navegadores y dispositivos

---

**Fecha de Creación**: [Fecha actual]  
**Última Actualización**: [Fecha actual]  
**Versión**: 1.0

