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
        success: 6,
        notice: 5,
        help: 7,
        info: 8,
        debug: 9,
    },
    colors: {
        emerg: 'red',
        fatal: 'red',
        error: 'red',
        alert: 'yellow',
        warning: 'yellow',
        success: 'green',
        notice: 'cyan',
        help: 'magenta',
        info: 'grey',
        debug: 'grey',
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
