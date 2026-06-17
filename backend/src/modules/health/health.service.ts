import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async check() {
    const database = this.dataSource.isInitialized ? "up" : "down";

    return {
      status: database === "up" ? "ok" : "degraded",
      service: "sunset-health-backend",
      database,
      checkedAt: new Date().toISOString()
    };
  }
}
