import type { NodeOAuthClient } from "@atproto/oauth-client-node";
import cors from "cors";
import dotenv from "dotenv";
import express, { type Express } from "express";
import connectDB from "./db";
import errorHandler from "./middleware/errorHandler";
import { initaliseOAuthClient } from "./oauth/oauthClient";
import { createOAuthRouter } from "./routes/oauthRoutes";
import { env } from "./utils/env";
import logger from "./utils/logger";
import { createApiRouter } from "./routes/apiRoutes";

dotenv.config();

class Server {
  private app: Express;
  private client!: NodeOAuthClient;

  constructor() {
    this.app = express();
    this.config();
  }

  private config(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(
      cors({
        origin: ["http://localhost:8081", "http://127.0.0.1:8081"],
        credentials: true,
        methods: ["GET", "POST", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );
    logger.info("Base middleware configured");
  }

  private async setupRoutes(client: NodeOAuthClient): Promise<void> {
    const oauthrouter = createOAuthRouter(client);
    const apiRouter = createApiRouter();

    this.app.use("/", oauthrouter);
    this.app.use("/api", apiRouter);

    logger.info("Routers mounted");
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      await connectDB();
      logger.info("Database connected!");

      const client = await initaliseOAuthClient();
      this.client = client;

      await this.setupRoutes(client);

      this.app.listen(env.PORT, "0.0.0.0", () => {
        logger.info(`Server listening on http://"0.0.0.0":${env.PORT}`);
      });
    } catch (error) {
      logger.error("Failed to start server", error);
      process.exit(1);
    }
  }
}

const server = new Server();
server.start();
