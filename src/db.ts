import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "./utils/logger";
import { env } from "./utils/env";

dotenv.config();

const connectDB = async () => {
  const mongoUri = env.MONGODB_URI;
  try {
    await mongoose.connect(mongoUri);
    logger.info("Mongodb Connected Successfully");
  } catch (error) {
    logger.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;
