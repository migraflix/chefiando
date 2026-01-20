import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

interface PermissionCheck {
  timestamp: string;
  ip: string;
  userAgent: string;
  airtable: {
    configured: boolean;
    baseAccessible: boolean;
    photosTableAccessible: boolean;
    canCreateRecords: boolean;
    error?: string;
  };
  webhook: {
    configured: boolean;
    accessible: boolean;
    acceptsPost: boolean;
    error?: string;
  };
  environment: {
    nodeEnv: string;
    hasAirtableKey: boolean;
    hasAirtableBase: boolean;
    hasWebhookUrl: boolean;
  };
}

/**
 * Ruta para verificar permisos y configuración de servicios externos
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const check: PermissionCheck = {
    timestamp: new Date().toISOString(),
    ip: request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        request.ip ||
        'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    airtable: {
      configured: false,
      baseAccessible: false,
      photosTableAccessible: false,
      canCreateRecords: false,
    },
    webhook: {
      configured: false,
      accessible: false,
      acceptsPost: false,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      hasAirtableKey: !!process.env.AIRTABLE_API_KEY,
      hasAirtableBase: !!process.env.AIRTABLE_BASE_ID,
      hasWebhookUrl: !!(process.env.PRODUCTOS_WEBHOOK || process.env.PRODUCTS_WEBHOOK_URL),
    }
  };

  try {
    console.log(`🔐 Verificando permisos desde IP: ${check.ip}`);

    // Verificar configuración de Airtable
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const PHOTOS_TABLE_NAME = "Fotos AI";

    if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
      check.airtable.configured = true;

      try {
        // Verificar acceso a la base
        const baseUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;
        const baseResponse = await fetch(baseUrl, {
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          },
        });

        if (baseResponse.ok) {
          check.airtable.baseAccessible = true;
          console.log("✅ Base de Airtable accesible");

          // Verificar acceso a la tabla de fotos
          const encodedTableName = encodeURIComponent(PHOTOS_TABLE_NAME);
          const tableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodedTableName}`;
          const tableResponse = await fetch(tableUrl, {
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            },
          });

          if (tableResponse.ok) {
            check.airtable.photosTableAccessible = true;
            console.log("✅ Tabla de fotos accesible");

            // Intentar crear un registro de prueba (sin guardarlo realmente)
            const testRecord = {
              fields: {
                Nombre: "Test Permission Check",
                Descripcion: "Registro de prueba para verificar permisos",
                Estado: "Test",
              }
            };

            const createResponse = await fetch(tableUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(testRecord),
            });

            if (createResponse.ok) {
              check.airtable.canCreateRecords = true;
              console.log("✅ Permisos de creación OK");

              // Eliminar el registro de prueba inmediatamente
              const createData = await createResponse.json();
              if (createData.id) {
                await fetch(`${tableUrl}/${createData.id}`, {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                  },
                });
                console.log("🗑️ Registro de prueba eliminado");
              }
            } else {
              check.airtable.error = `No se pueden crear registros: ${createResponse.status} ${createResponse.statusText}`;
              console.error("❌ Error creando registro de prueba:", createResponse.status, createResponse.statusText);
            }
          } else {
            check.airtable.error = `Tabla no accesible: ${tableResponse.status} ${tableResponse.statusText}`;
            console.error("❌ Tabla de fotos no accesible:", tableResponse.status, tableResponse.statusText);
          }
        } else {
          check.airtable.error = `Base no accesible: ${baseResponse.status} ${baseResponse.statusText}`;
          console.error("❌ Base de Airtable no accesible:", baseResponse.status, baseResponse.statusText);
        }
      } catch (airtableError) {
        check.airtable.error = `Error de conexión: ${airtableError instanceof Error ? airtableError.message : 'Error desconocido'}`;
        console.error("❌ Error de conexión con Airtable:", airtableError);
      }
    } else {
      check.airtable.error = "Variables de entorno faltantes";
      console.error("❌ Variables de Airtable no configuradas");
    }

    // Verificar configuración del webhook
    const WEBHOOK_URL = process.env.PRODUCTOS_WEBHOOK || process.env.PRODUCTS_WEBHOOK_URL;

    if (WEBHOOK_URL) {
      check.webhook.configured = true;

      try {
        // Verificar conectividad con HEAD
        const headResponse = await fetch(WEBHOOK_URL, {
          method: 'HEAD',
        });

        if (headResponse.ok || headResponse.status === 405) {
          check.webhook.accessible = true;
          console.log("✅ Webhook accesible");

          // Verificar si acepta POST
          const postResponse = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ test: true, source: 'permission-check' }),
          });

          if (postResponse.ok || postResponse.status === 200 || postResponse.status === 201) {
            check.webhook.acceptsPost = true;
            console.log("✅ Webhook acepta POST");
          } else {
            check.webhook.error = `POST no aceptado: ${postResponse.status} ${postResponse.statusText}`;
            console.warn("⚠️ Webhook no acepta POST correctamente:", postResponse.status);
          }
        } else {
          check.webhook.error = `No accesible: ${headResponse.status} ${headResponse.statusText}`;
          console.error("❌ Webhook no accesible:", headResponse.status);
        }
      } catch (webhookError) {
        check.webhook.error = `Error de conexión: ${webhookError instanceof Error ? webhookError.message : 'Error desconocido'}`;
        console.error("❌ Error de conexión con webhook:", webhookError);
      }
    } else {
      check.webhook.error = "URL del webhook no configurada";
      console.error("❌ URL del webhook no configurada");
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`🔐 Verificación de permisos completada en ${duration}ms`);

    // Enviar a Sentry si hay problemas
    const hasErrors = !!(check.airtable.error || check.webhook.error);
    if (hasErrors) {
      Sentry.captureMessage(`Permission Check Failed from ${check.ip}`, {
        level: 'warning',
        tags: {
          route: '/api/debug/permissions',
          method: 'GET',
          component: 'debug',
          hasAirtableError: !!check.airtable.error,
          hasWebhookError: !!check.webhook.error,
        },
        extra: {
          check,
          duration,
        }
      });
    }

    return NextResponse.json({
      success: !hasErrors,
      check,
      duration,
      message: hasErrors
        ? "❌ Hay problemas de permisos o configuración"
        : "✅ Todos los permisos verificados correctamente",
    });

  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error("❌ Error fatal en verificación de permisos:", error);

    Sentry.captureException(error, {
      tags: {
        route: '/api/debug/permissions',
        method: 'GET',
        component: 'debug',
        errorType: 'FATAL_ERROR'
      },
      extra: {
        check,
        duration,
      }
    });

    return NextResponse.json(
      {
        success: false,
        check,
        duration,
        error: error instanceof Error ? error.message : "Error fatal en verificación de permisos",
      },
      { status: 500 }
    );
  }
}