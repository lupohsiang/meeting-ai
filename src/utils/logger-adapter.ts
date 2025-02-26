import type { Logger } from "pino";

export function createConsoleAdapter(logger: Logger) {
  return {
    ...console,
    log: (...args: unknown[]) => logger.info(args),
    info: (...args: unknown[]) => logger.info(args),
    warn: (...args: unknown[]) => logger.warn(args),
    error: (...args: unknown[]) => logger.error(args),
    debug: (...args: unknown[]) => logger.debug(args),
  };
}
