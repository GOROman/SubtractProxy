import winston from 'winston';
import { Config } from '../config';

export const createLogger = (config: Config) => {
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      ),
    }),
  ];

  if (config.logging.file) {
    transports.push(
      new winston.transports.File({
        filename: config.logging.file,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      })
    );
  }

  return winston.createLogger({
    level: config.logging.level,
    transports,
  });
};
