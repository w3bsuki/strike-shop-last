/**
 * OpenTelemetry Configuration for Production Monitoring
 * Provides structured metrics, tracing, and logging
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

// Initialize OpenTelemetry SDK only once
let sdkInitialized = false;

export function initializeTelemetry() {
  if (sdkInitialized || typeof window !== 'undefined') {
    return; // Already initialized or running in browser
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const serviceName = process.env.OTEL_SERVICE_NAME || 'strike-shop';
  const serviceVersion = process.env.OTEL_SERVICE_VERSION || '1.0.0';

  // Configure trace exporter
  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
    headers: {
      'api-key': process.env.OTEL_API_KEY || '',
    },
  });

  // Configure metrics exporter
  const metricExporter = new OTLPMetricExporter({
    url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || 'http://localhost:4318/v1/metrics',
    headers: {
      'api-key': process.env.OTEL_API_KEY || '',
    },
  });

  // Create SDK instance
  const sdk = new NodeSDK({
    serviceName,
    traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: isProduction ? 30000 : 5000, // 30s prod, 5s dev
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable some instrumentations if needed
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // Avoid noise from file system operations
        },
      }),
    ],
  });

  // Initialize the SDK
  try {
    sdk.start();
    sdkInitialized = true;
    console.log('[Telemetry] OpenTelemetry initialized successfully');
  } catch (error) {
    console.error('[Telemetry] Failed to initialize OpenTelemetry:', error);
  }

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('[Telemetry] OpenTelemetry terminated'))
      .catch((error) => console.error('[Telemetry] Error terminating OpenTelemetry', error))
      .finally(() => process.exit(0));
  });
}

// Auto-initialize in server environment
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  initializeTelemetry();
}