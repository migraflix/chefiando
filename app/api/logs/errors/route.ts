import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

type Recommendation = {
  type: string;
  message: string;
  action: string;
};

/**
 * Endpoint para consultar logs de errores recientes
 * Útil para debugging y seguimiento de bugs reportados
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formType = searchParams.get('formType'); // 'registration' | 'photo-upload' | 'all'
    const limit = parseInt(searchParams.get('limit') || '50');
    const hours = parseInt(searchParams.get('hours') || '24'); // Últimas N horas

    // Calcular timestamp desde cuándo buscar
    const since = new Date();
    since.setHours(since.getHours() - hours);

    console.log(`📊 Consultando logs de errores: formType=${formType}, limit=${limit}, hours=${hours}`);

    // En un entorno real, aquí consultaríamos una base de datos de logs
    // Por ahora, devolveremos un resumen de lo que Sentry podría tener

    // Simular consulta de logs (en producción esto vendría de una DB)
    const mockLogs = {
      summary: {
        totalErrors: 0,
        byFormType: {
          registration: 0,
          'photo-upload': 0,
          other: 0
        },
        byStep: {},
        timeRange: {
          from: since.toISOString(),
          to: new Date().toISOString()
        }
      },
      recentErrors: [],
      recommendations: [] as Recommendation[],
      sentryInfo: null as any
    };

    // Intentar obtener información de Sentry (si está disponible)
    try {
      // Esto es conceptual - en la práctica necesitaríamos una forma de consultar Sentry
      const sentryInfo = {
        configured: !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        lastErrorTimestamp: new Date().toISOString()
      };

      mockLogs.sentryInfo = sentryInfo;
    } catch (sentryError) {
      console.warn('No se pudo obtener información de Sentry:', sentryError);
    }

    // Agregar recomendaciones basadas en patrones comunes
    mockLogs.recommendations = [
      {
        type: 'info',
        message: 'Revisa los logs de Sentry para errores específicos',
        action: 'Visita https://sentry.io para ver los bugs reportados'
      },
      {
        type: 'warning',
        message: 'Los usuarios con conexiones lentas pueden tener timeouts',
        action: 'Considera aumentar timeouts o comprimir imágenes'
      },
      {
        type: 'error',
        message: 'Errores de validación indican problemas de entrada de usuario',
        action: 'Mejora los mensajes de error y validaciones del lado cliente'
      }
    ];

    return NextResponse.json({
      success: true,
      logs: mockLogs,
      message: `Logs de errores consultados (últimas ${hours} horas)`
    });

  } catch (error) {
    console.error('Error consultando logs:', error);

    Sentry.captureException(error, {
      tags: {
        component: 'api',
        endpoint: '/api/logs/errors',
        errorType: 'log_query_error'
      }
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * Endpoint para reportar un error manualmente (útil para testing)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { error, formType, step, formData, metadata } = body;

    console.log('📝 Reporte de error manual recibido:', { formType, step, error: error?.message });

    // Crear un bug report usando el logger
    const { logFormError } = await import('@/lib/error-logger');
    const sessionId = await logFormError(
      error || 'Error manual reportado',
      formType || 'other',
      step || 'manual_report',
      formData,
      metadata
    );

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Error reportado exitosamente'
    });

  } catch (error) {
    console.error('Error en reporte manual:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error en reporte manual',
      },
      { status: 500 }
    );
  }
}