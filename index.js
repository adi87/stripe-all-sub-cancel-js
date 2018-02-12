var Promise, program, logger, runScript;

Promise = require('bluebird');

logger = require('./lib/logger');

program = require('commander');

co = require('co');

runScript = require('./lib/index.js').run;

if (require.main === module) {
    program
    .version('0.1.0')
    .option('--secret-key [secretKey]', "The secret key for the Stripe account with the subscriptions to cancel")
    .option('-b, --batch-size [batchSize]', "The number of stripe customers to fetch per batch (defaults to 10)")
    .option('--dry-run', "If provided, no actual cancellations take place")
    .parse(process.argv);

    Promise.resolve(co((function(_this) {
        return function() {
            return runScript(program);
        };
    })(this))).then(function(result) {
        logger.info("Finished running", result);
        return process.exit(0);
    })["catch"](function(err) {
        logger.error(err);
        return process.exit(1);
    });
}
