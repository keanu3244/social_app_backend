
import app from "./app";
import notifier from "node-notifier";
import config from "./config/env";
import { Socket } from "socket.io";
import IO from "./modules/socket/socket";
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

process.on("uncaughtException", () => {});
process.on("unhandledRejection", () => {});
console.log(process.env.NODE_ENV);
IO;
console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("REDIS_HOST:", process.env.REDIS_HOST);
app.listen(config.port, () => {
  console.log("🚀 Server Started @:", config.port);
});
