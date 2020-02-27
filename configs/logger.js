var winston = require('winston');
var config = require('./config');
const path = require('path');
const filename_error = path.join(__dirname, 'logs/file_error.log');
const filename_info = path.join(__dirname, 'logs/file_info.log');
//will log all the errors to error.log and info to into.log in /logs folder
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(), //append timestap of the logger
        winston.format.prettyPrint()//format the logs
    ),
    transports: [
        //
        // - Write to all logs with level `info` and below to `filename_info` 
        // - Write all logs error (and below) to `error.log`.
        //
        new winston.transports.File({ filename: filename_error, level: 'error' }),
        new winston.transports.File({ filename: filename_info })
    ]
});
if (config.inProduction === false) {
    //adding the logs to the console in dev mod
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}
module.exports = logger;