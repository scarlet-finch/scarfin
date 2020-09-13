// const log = require('simple-node-logger').createSimpleLogger();

// module.exports = log;

const winston = require('winston');
const logLevels = {
    levels: {
        emerg: 0,
        alert: 1,
        fatal: 2,
        error: 3,
        warning: 4,
        notice: 5,
        success: 6,
        info: 7,
        debug: 8,
    },
    colors: {
        emerg: 'red',
        alert: 'yellow',
        fatal: 'red',
        error: 'red',
        warning: 'yellow',
        notice: 'cyan',
        success: 'green',
        info: 'blue',
        debug: 'white',
    },
};
winston.addColors(logLevels);

const make_logger = (level) => {
    const logger = winston.createLogger({
        levels: logLevels.levels,
        level: level,
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                ),
                colorize: true,
            }),
        ],
    });
    return logger;
};

module.exports = make_logger;
