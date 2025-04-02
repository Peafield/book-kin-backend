import dotenv from "dotenv";
import { cleanEnv, port, str, testOnly, url } from "envalid";

dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "production", "test"],
    default: "development",
    desc: "Node environment",
  }),
  PORT: port({
    default: 8080,
    desc: "Port for the backend server",
  }),
  MONGODB_URI: str({
    desc: "MongoDB connection string (e.g., mongodb://... or mongodb+srv://...)",
  }),
  CLIENT_URI: url({
    desc: "OAuth Client URI (public HTTPS URL for client metadata)",
  }),
  APP_BASE_DEEPLINK: str({
    desc: "Base deep link for redirecting back to the mobile app (e.g., bookkin://callback)",
  }),
  PRIVATE_KEY_1: str({
    desc: "Primary private key in PEM PKCS#8 format (use \\n for newlines)",
  }),
  JWT_SECRET: str({
    desc: "Secret key used for signing application JWTs",
  }),
});
