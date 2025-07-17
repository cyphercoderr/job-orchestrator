import { registerAs } from "@nestjs/config";

export default registerAs("database", () => ({
  mongodb: {
    uri:
      process.env.MONGODB_URI || "mongodb://localhost:27017/test-orchestration",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number.parseInt(process.env.REDIS_PORT ?? "6379", 10),
    db: Number.parseInt(process.env.REDIS_DB ?? "0", 10),
  },
}));
