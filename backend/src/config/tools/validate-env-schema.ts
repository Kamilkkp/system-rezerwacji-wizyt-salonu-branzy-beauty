import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { BaseEnvSchema } from '../schemas/base-env.schema';
import { EnvironmentValue } from '../enums/environment-value.enum';
import { LocalEnvSchema } from '../schemas/local-env.schema';
import { ProductionEnvSchema } from '../schemas/production-env.schema';

const getDesiredEnvSchema = (
  env: EnvironmentValue,
): new () => LocalEnvSchema | ProductionEnvSchema => {
  switch (env) {
    case EnvironmentValue.Local:
      return LocalEnvSchema;
    case EnvironmentValue.Production:
      return ProductionEnvSchema;
  }
};

export function validateEnvSchema(config: Record<string, unknown>) {
  const baseEnvConfig = plainToInstance(BaseEnvSchema, config, {
    enableImplicitConversion: true,
  });
  const baseEnvValidationErrors = validateSync(baseEnvConfig, {
    skipMissingProperties: false,
  });

  if (baseEnvValidationErrors.length > 0) {
    throw new Error(baseEnvValidationErrors.toString());
  }

  const DesiredEnvSchema = getDesiredEnvSchema(baseEnvConfig.NODE_ENV);

  const desiredEnvConfig = plainToInstance(DesiredEnvSchema, config, {
    enableImplicitConversion: true,
  });
  const desiredEnvValidationErrors = validateSync(desiredEnvConfig, {
    skipMissingProperties: false,
  });

  if (desiredEnvValidationErrors.length > 0) {
    throw new Error(desiredEnvValidationErrors.toString());
  }

  return desiredEnvConfig;
}
