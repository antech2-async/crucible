import pino from 'pino';

// pino-pretty uses worker_threads which is unavailable in Next.js serverless
// (Vercel). Skip the transport there and fall back to plain JSON output.
const useTransport =
  process.env.VERCEL !== '1' &&
  process.env.VERCEL_ENV === undefined &&
  typeof window === 'undefined';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(useTransport
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard',
          },
        },
      }
    : {}),
});

export function createChildLogger(name: string) {
  return logger.child({ module: name });
}
