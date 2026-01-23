/**
 * Sistema centralizado de logging y reporting de errores
 * Captura todos los errores en formularios y los reporta automáticamente
 */

import * as Sentry from "@sentry/nextjs";

export interface BugReport {
  // Información del error
  error: {
    message: string;
    stack?: string;
    name: string;
    code?: string;
  };

  // Contexto del usuario
  user: {
    id?: string;
    email?: string;
    sessionId: string;
    userAgent: string;
    language: string;
    platform: string;
    screenResolution: string;
    timezone: string;
    url: string;
    referrer?: string;
  };

  // Contexto técnico
  technical: {
    timestamp: string;
    formType: 'registration' | 'photo-upload' | 'other';
    step?: string;
    browser: {
      name: string;
      version: string;
      online: boolean;
      cookieEnabled: boolean;
    };
    connection?: {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
    };
    memory?: {
      used: number;
      total: number;
      limit: number;
    };
    performance: {
      navigationStart: number;
      loadTime: number;
      domReadyTime: number;
    };
  };

  // Datos del formulario (sanitizados)
  formData?: {
    fields: Record<string, any>;
    validationErrors?: Record<string, string>;
    files?: Array<{
      name: string;
      size: number;
      type: string;
      dimensions?: { width: number; height: number };
    }>;
  };

  // Contexto adicional
  metadata?: Record<string, any>;
}

class ErrorLogger {
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Captura y reporta un error del formulario
   */
  async logFormError(
    error: Error | string,
    formType: 'registration' | 'photo-upload' | 'other',
    step?: string,
    formData?: any,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      // Crear el bug report completo
      const bugReport = this.createBugReport(error, formType, step, formData, metadata);

      // Log en consola con formato especial
      console.error('🚨 BUG REPORT:', {
        sessionId: bugReport.user.sessionId,
        formType: bugReport.technical.formType,
        step: bugReport.technical.step,
        error: bugReport.error.message,
        timestamp: bugReport.technical.timestamp
      });

      // Enviar a Sentry con contexto completo
      Sentry.captureException(
        error instanceof Error ? error : new Error(error),
        {
          tags: {
            component: 'form-error',
            formType: bugReport.technical.formType,
            step: bugReport.technical.step || 'unknown',
            sessionId: bugReport.user.sessionId,
            browser: bugReport.technical.browser.name,
            platform: bugReport.user.platform,
          },
          extra: {
            bugReport: JSON.stringify(bugReport, null, 2),
            formData: this.sanitizeFormData(formData),
            userContext: bugReport.user,
            technicalContext: bugReport.technical,
          },
          level: 'error',
        }
      );

      // También log como evento personalizado en Sentry
      Sentry.captureMessage(
        `Form Error: ${formType} - ${step || 'unknown'}`,
        {
          level: 'error',
          tags: {
            formError: 'true',
            errorType: 'form_validation',
            severity: 'high'
          },
          extra: { bugReport }
        }
      );

      // Devolver el session ID para tracking
      return bugReport.user.sessionId;

    } catch (loggingError) {
      // Si falla el logging, al menos log básico
      console.error('❌ Error en el sistema de logging:', loggingError);
      console.error('📋 Error original:', error);

      // Intentar al menos enviar a Sentry el error básico
      try {
        Sentry.captureException(
          error instanceof Error ? error : new Error(error),
          {
            tags: {
              component: 'form-error',
              loggingFailed: 'true',
              formType: formType,
              step: step || 'unknown'
            },
            extra: {
              originalError: error,
              loggingError: loggingError,
              sessionId: this.sessionId
            }
          }
        );
      } catch (sentryError) {
        console.error('❌ Error crítico: ni siquiera Sentry funciona:', sentryError);
      }

      return this.sessionId;
    }
  }

  /**
   * Log de eventos no críticos pero importantes
   */
  async logFormWarning(
    message: string,
    formType: 'registration' | 'photo-upload' | 'other',
    step?: string,
    data?: any
  ): Promise<void> {
    console.warn(`⚠️ FORM WARNING [${formType}]: ${message}`, {
      step,
      data,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    });

    Sentry.captureMessage(
      `Form Warning: ${formType} - ${message}`,
      {
        level: 'warning',
        tags: {
          component: 'form-warning',
          formType: formType,
          step: step || 'unknown',
          sessionId: this.sessionId
        },
        extra: {
          message,
          step,
          data,
          timestamp: new Date().toISOString()
        }
      }
    );
  }

  /**
   * Log de eventos exitosos importantes
   */
  async logFormSuccess(
    message: string,
    formType: 'registration' | 'photo-upload' | 'other',
    step?: string,
    data?: any
  ): Promise<void> {
    console.log(`✅ FORM SUCCESS [${formType}]: ${message}`, {
      step,
      data,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    });
  }

  private createBugReport(
    error: Error | string,
    formType: 'registration' | 'photo-upload' | 'other',
    step?: string,
    formData?: any,
    metadata?: Record<string, any>
  ): BugReport {
    const now = Date.now();
    const errorObj = error instanceof Error ? error : new Error(error);

    // Detectar navegador
    const browserInfo = this.detectBrowser();

    // Información de conexión
    const connectionInfo = this.getConnectionInfo();

    // Información de memoria
    const memoryInfo = this.getMemoryInfo();

    // Información de rendimiento
    const perfInfo = this.getPerformanceInfo();

    return {
      error: {
        message: errorObj.message,
        stack: errorObj.stack,
        name: errorObj.name,
        code: (errorObj as any).code
      },
      user: {
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        referrer: typeof document !== 'undefined' ? document.referrer : undefined
      },
      technical: {
        timestamp: new Date().toISOString(),
        formType,
        step,
        browser: {
          name: browserInfo.name,
          version: browserInfo.version,
          online: navigator.onLine,
          cookieEnabled: navigator.cookieEnabled
        },
        connection: connectionInfo,
        memory: memoryInfo,
        performance: perfInfo
      },
      formData: formData ? this.sanitizeFormData(formData) : undefined,
      metadata
    };
  }

  private detectBrowser(): { name: string; version: string } {
    const ua = navigator.userAgent;

    // Detectar Chrome
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      const match = ua.match(/Chrome\/(\d+)/);
      return { name: 'Chrome', version: match ? match[1] : 'unknown' };
    }

    // Detectar Edge
    if (ua.includes('Edg')) {
      const match = ua.match(/Edg\/(\d+)/);
      return { name: 'Edge', version: match ? match[1] : 'unknown' };
    }

    // Detectar Safari
    if (ua.includes('Safari') && !ua.includes('Chrome')) {
      const match = ua.match(/Version\/(\d+)/);
      return { name: 'Safari', version: match ? match[1] : 'unknown' };
    }

    // Detectar Firefox
    if (ua.includes('Firefox')) {
      const match = ua.match(/Firefox\/(\d+)/);
      return { name: 'Firefox', version: match ? match[1] : 'unknown' };
    }

    return { name: 'Unknown', version: 'unknown' };
  }

  private getConnectionInfo() {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as any).connection;
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt
      };
    }
    return undefined;
  }

  private getMemoryInfo() {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const mem = (performance as any).memory;
      return {
        used: mem.usedJSHeapSize,
        total: mem.totalJSHeapSize,
        limit: mem.jsHeapSizeLimit
      };
    }
    return undefined;
  }

  private getPerformanceInfo() {
    if (typeof performance !== 'undefined' && performance.timing) {
      const timing = performance.timing;
      return {
        navigationStart: timing.navigationStart,
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart
      };
    }
    return {
      navigationStart: 0,
      loadTime: 0,
      domReadyTime: 0
    };
  }

  private sanitizeFormData(formData: any): any {
    if (!formData) return undefined;

    // Función recursiva para sanitizar datos sensibles
    const sanitize = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;

      const sanitized: any = Array.isArray(obj) ? [] : {};

      for (const [key, value] of Object.entries(obj)) {
        // Campos sensibles que no queremos loguear
        if (['password', 'token', 'secret', 'key', 'auth'].some(sensitive =>
          key.toLowerCase().includes(sensitive)
        )) {
          sanitized[key] = '[REDACTED]';
        }
        // Archivos binarios - solo metadata
        else if (value instanceof File) {
          sanitized[key] = {
            name: value.name,
            size: value.size,
            type: value.type,
            lastModified: value.lastModified
          };
        }
        // Strings muy largos - truncar
        else if (typeof value === 'string' && value.length > 500) {
          sanitized[key] = value.substring(0, 500) + '... [TRUNCATED]';
        }
        // Recursivo para objetos anidados
        else if (typeof value === 'object') {
          sanitized[key] = sanitize(value);
        }
        else {
          sanitized[key] = value;
        }
      }

      return sanitized;
    };

    return sanitize(formData);
  }
}

// Instancia singleton
export const errorLogger = new ErrorLogger();

// Hook de React para usar el logger
export function useErrorLogger() {
  return {
    logFormError: errorLogger.logFormError.bind(errorLogger),
    logFormWarning: errorLogger.logFormWarning.bind(errorLogger),
    logFormSuccess: errorLogger.logFormSuccess.bind(errorLogger),
  };
}

// Función helper para logging rápido
export const logFormError = (
  error: Error | string,
  formType: 'registration' | 'photo-upload' | 'other',
  step?: string,
  formData?: any,
  metadata?: Record<string, any>
) => errorLogger.logFormError(error, formType, step, formData, metadata);

export const logFormWarning = (
  message: string,
  formType: 'registration' | 'photo-upload' | 'other',
  step?: string,
  data?: any
) => errorLogger.logFormWarning(message, formType, step, data);

export const logFormSuccess = (
  message: string,
  formType: 'registration' | 'photo-upload' | 'other',
  step?: string,
  data?: any
) => errorLogger.logFormSuccess(message, formType, step, data);