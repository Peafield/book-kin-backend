import type { NodeOAuthClient } from "@atproto/oauth-client-node";
import cors from "cors";
import connectDB from "./db";
import dotenv from "dotenv";
import express, { type Express } from "express";
import { initaliseOAuthClient } from "./oauth/oauthClient";
import errorHandler from "./middleware/errorHandler";
import { createOAuthRouter } from "./routes/oauthRoutes";
import logger from "./utils/logger";

dotenv.config();

class Server {
  private app: Express;
  private port: number;
  private client!: NodeOAuthClient;

  constructor() {
    this.app = express();
    this.port = Number.parseInt(process.env.PORT || "8080", 10);
    this.config();
  }

  private config(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(
      cors({
        origin: ["http://localhost:8081", "http://127.0.0.1:8081"],
        credentials: true,
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );
    logger.info("Base middleware configured");
  }

  private async setupRoutes(client: NodeOAuthClient): Promise<void> {
    const oauthrouter = createOAuthRouter(client);
    // const apiRouter = createrApiRouter(client);

    this.app.use("/", oauthrouter);
    // this.app.use('/api', apiRouter)

    logger.info("Routers mounted");
    this.app.use(errorHandler);
    logger.info("");
  }

  public async start(): Promise<void> {
    try {
      await connectDB();
      logger.info("Database connected!");

      const client = await initaliseOAuthClient();
      this.client = client;

      await this.setupRoutes(client);

      this.app.listen(this.port, "0.0.0.0", () => {
        logger.info(`Server listening on http://"0.0.0.0":${this.port}`);
      });
    } catch (error) {
      logger.error("Failed to start server", error);
      process.exit(1);
    }
  }
}

const server = new Server();
server.start();
