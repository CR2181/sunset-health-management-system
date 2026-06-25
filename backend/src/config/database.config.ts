import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export function createDatabaseConfig(config: ConfigService): TypeOrmModuleOptions {
  const dbType = config.get<string>("DB_TYPE", "postgres");
  const type = dbType === "mysql" ? "mysql" : "postgres";
  const synchronize = config.get<string>("DB_SYNC", "true") === "true";

  if (config.get<string>("NODE_ENV", "development") === "production" && synchronize) {
    throw new Error("DB_SYNC must be false in production. Use reviewed database migrations instead.");
  }

  return {
    type,
    host: config.get<string>("DB_HOST", "127.0.0.1"),
    port: config.get<number>("DB_PORT", type === "mysql" ? 3306 : 5432),
    username: config.get<string>("DB_USERNAME", type === "mysql" ? "root" : "postgres"),
    password: config.get<string>("DB_PASSWORD", ""),
    database: config.get<string>("DB_DATABASE", "sunset_health"),
    autoLoadEntities: true,
    synchronize
  };
}
