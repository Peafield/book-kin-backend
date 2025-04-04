import { addColors, createLogger, format, transports } from "winston";

const loggerLevels = {
  levels: {
    error: 0,
    warn: 1,
    help: 2,
    data: 3,
    info: 4,
    debug: 5,
    prompt: 6,
    verbose: 7,
    input: 8,
    silly: 9,
  },
  colors: {
    error: "red",
    warn: "yellow",
    help: "cyan",
    data: "magenta",
    info: "green",
    debug: "blue",
    prompt: "white",
    verbose: "grey",
    input: "green",
    silly: "rainbow",
  },
  emojis: {
    error: "🔥",
    warn: "⚠️",
    help: "❓",
    data: "💾",
    info: "✅",
    debug: "🐛",
    prompt: "💬",
    verbose: "🔬",
    input: "⌨️",
    silly: "🤪",
  },
};

addColors(loggerLevels.colors);

const customFormat = format.combine(
  format.timestamp({ format: "DD-MM-YYYY HH:mm:ss" }),
  format.colorize(),
  format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const originalLevel = info[Symbol.for("level")];
    const emoji =
      loggerLevels.emojis[originalLevel as keyof typeof loggerLevels.emojis] ||
      "";
    const metaString = Object.keys(meta).length
      ? JSON.stringify(meta, null, 2)
      : "";
    return `${timestamp} ${emoji} - ${level}: ${message} ${metaString}`.trim();
  })
);

const logger = createLogger({
  levels: loggerLevels.levels,
  level: "silly",
  format: customFormat,
  transports: [
    new transports.Console(),
    new transports.File({ filename: "error.log", level: "error" }),
  ],
});

export default logger;
