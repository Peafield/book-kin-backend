import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "./utils/logger";

dotenv.config();

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    logger.error("Error: MONGODB_URI is not defined in .env(.local) file");
    process.exit(1);
  }
  try {
    await mongoose.connect(mongoUri);
    logger.info("Mongodb Connected Successfully");
  } catch (error) {
    logger.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;
