// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Solo inicializar si tenemos un DSN
if (dsn) {
  Sentry.init({
    dsn: dsn,

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Session Replay - Grabar sesiones cuando hay errores
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.5,

    // Capturar más contexto automáticamente
    beforeSend(event, hint) {
      // Agregar información adicional al error
      if (event.contexts) {
        event.contexts.browser = {
          ...event.contexts.browser,
          userAgent: navigator.userAgent,
          language: navigator.language,
        };
      }

      // Agregar tags útiles
      event.tags = {
        ...event.tags,
        component: 'client',
        environment: process.env.NODE_ENV || 'development',
      };

      return event;
    },

    // Filtrar errores que no queremos enviar (opcional)
    ignoreErrors: [
      // Errores de red comunes que no son útiles
      'NetworkError',
      'Failed to fetch',
      // Errores de extensiones del navegador
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',
      'fb_xd_fragment',
      'bmi_SafeAddOnload',
      'EBCallBackMessageReceived',
      'conduitPage',
    ],

    // Integraciones
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
    ],

    // Capturar errores no manejados automáticamente
    captureUnhandledRejections: true,
  });
}

