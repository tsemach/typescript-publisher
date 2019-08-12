import { createLogger, format, transports } from 'winston';
const { combine, timestamp, printf } = format;

const myFormat = printf(({ level, message, timestamp }) => {
  return `${level}: ${timestamp} ${message}`;
});

const logger = createLogger({
  format: combine(    
    myFormat,    
  ),
  transports: [new transports.Console()]
});


// const logger = createLogger({
//   level: 'info',
//   defaultMeta: { service: 'your-service-name' },
//   format: format.combine(
//     format.timestamp({
//       format: 'YYYY-MM-DD HH:mm:ss'
//     }),
//     format.errors({ stack: true }),     
//   ),
//   transports: [
//     //
//     // - Write to all logs with level `info` and below to `quick-start-combined.log`.
//     // - Write all logs error (and below) to `quick-start-error.log`.
//     //
//     new transports.File({ filename: 'quick-start-error.log', level: 'error' }),
//     new transports.File({ filename: 'quick-start-combined.log' })
//   ]
// });

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

if (process.env.NODE_ENV === 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.splat(),
      format.json()
    )
  }));
}

export default logger;