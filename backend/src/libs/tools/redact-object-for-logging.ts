import { isSecretKey } from './is-secret';

export const redactObjectForLogging = (obj: Record<string, unknown>) => {
  const redactObjectForLoggingRecursive = (
    node: Record<string, unknown>,
    depth: number,
  ) => {
    if (depth > 10) {
      return '[Object is nested too deep for logging]';
    }

    const keys = Object.keys(node);

    if (keys.length > 100) {
      return '[Object is too large for logging]';
    }

    return keys.reduce((acc: Record<string, unknown>, key) => {
      const value = node[key];

      if (isSecretKey(key)) {
        acc[key] = '[REDACTED]';
        return acc;
      }

      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        acc[key] = redactObjectForLoggingRecursive(
          value as Record<string, unknown>,
          depth + 1,
        );
        return acc;
      }

      acc[key] = node[key];

      return acc;
    }, {});
  };

  return redactObjectForLoggingRecursive(obj, 0);
};
