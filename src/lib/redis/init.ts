import { createClient } from "redis";
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  // port: 10192,
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  family: 4,
});

export default redis;
