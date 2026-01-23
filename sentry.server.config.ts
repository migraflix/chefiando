// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Capturar más contexto automáticamente
  beforeSend(event, hint) {
    // Agregar información del servidor
    event.tags = {
      ...event.tags,
      component: 'server',
      environment: process.env.NODE_ENV || 'development',
    };

    // Agregar información de la request si está disponible
    if ((hint as any).request) {
      event.contexts = {
        ...event.contexts,
        request: {
          method: (hint as any).request.method,
          url: (hint as any).request.url,
          headers: (hint as any).request.headers,
        },
      };
    }

    return event;
  },

  // Uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: process.env.NODE_ENV === 'development',
});

