var formatTimestamp, logger, moment, winston;

winston = require('winston');

moment = require('moment');

formatTimestamp = function() {
    return moment().format('YYYY-MM-DD HH:mm:ss');
};

logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            handleExceptions: true,
            level: process.env.DEBUG != null ? 'debug' : 'info',
            colorize: true,
            timestamp: formatTimestamp,
            prettyPrint: true
        })
    ]
});

logger.stream = {
    write: function(message, encoding) {
        return logger.info(message.replace(/\n$/, ""));
    }
};

module.exports = logger;
