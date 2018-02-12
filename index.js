var Promise, _, cancelSubscription, co, getStripeCustomers, logger, processCustomers, program, run, stripe, dryRun;

Promise = require('bluebird');

logger = require('./libs/logger');

program = require('commander');

co = require('co');

dryRun = false;

getStripeCustomers = function(starting_after, batchSize) {
    var query;
    if (starting_after == null) {
        starting_after = null;
    }
    if (batchSize == null) {
        batchSize = 3;
    }
    query = {
        limit: batchSize
    };
    if (starting_after != null) {
        query.starting_after = starting_after;
    }
    return stripe.customers.list(query).then(function(customers) {
        return {
            customers: customers.data,
            hasMore: customers.has_more
        };
    });
};

cancelSubscription = co.wrap(function*(sub) {
    var ref, ref1, result;
    logger.info("Customer " + sub.customer + " | Cancelling subscription " + sub.id + " for $" + (((ref = sub.plan) != null ? ref.amount : void 0) / 100 || 'n/a'));
    if (!dryRun) {
        result = (yield stripe.customers.cancelSubscription(sub.customer, sub.id, {
            at_period_end: true
        }));
    } else {
        logger.debug("Dry run, not cancelling subscription: " + sub.id);
    }
    return Promise.resolve({
        id: sub.id,
        amount: ((ref1 = sub.plan) != null ? ref1.amount : void 0) / 100
    });
});

processCustomers = function*(customers) {
    var cancelledSubs, cancelledSubscriptions, customer, err, i, len, ref, ref1;

    if (!(customers != null ? customers.length : void 0)) {
        return Promise.resolve([]);
    }
    logger.info("Processing " + customers.length + " customers");
    cancelledSubscriptions = [];
    for (i = 0, len = customers.length; i < len; i++) {
        customer = customers[i];
        logger.debug("Processing customer " + customer.id + " [" + customer.email + "]");
        if ((ref = customer.subscriptions.data) != null ? ref.length : void 0) {
            try {
                cancelledSubs = (yield Promise.map(customer.subscriptions.data, cancelSubscription));
                if (cancelledSubs) {
                    cancelledSubscriptions = cancelledSubscriptions.concat(cancelledSubs);
                }
            } catch (_error) {
                err = _error;
                logger.error("Error cancelling subscriptions for " + customer.id, customer);
                logger.error(err);
            }
        }
    }
    return Promise.resolve({
        cancelledSubscriptions: cancelledSubscriptions
    });
};

run = function*(opts) {
    var batchSize, cancelledSubscriptions, count, customers, delay, hasMore, i, lastId, len, ref, result, sub, totalAmount;
    result = [];
    hasMore = true;
    count = 0;
    lastId = null;
    delay = null;
    totalAmount = 0;
    batchSize = parseInt(opts.batchSize || 10, 10);
    logger.info("Starting customer download");
    while (hasMore) {
        ref = (yield getStripeCustomers(lastId, batchSize)), customers = ref.customers, hasMore = ref.hasMore;
        count += customers.length;
        lastId = customers[customers.length - 1].id;
        cancelledSubscriptions = (yield processCustomers(customers)).cancelledSubscriptions;
        for (i = 0, len = cancelledSubscriptions.length; i < len; i++) {
            sub = cancelledSubscriptions[i];
            totalAmount += sub.amount;
        }
        result = result.concat(cancelledSubscriptions);
        logger.info("Done processing " + count + " customers | " + result.length + " subscriptions, $" + totalAmount + " cancelled");
        (yield Promise.delay(100));
    }
    logger.info("Total Customers processed " + count + " | " + result.length + " subscriptions, $" + totalAmount + " cancelled");
    return result;
};

if (require.main === module) {
    program
    .version('0.1.0')
    .option('--secret-key [secretKey]', "The secret key for the Stripe account with the subscriptions to cancel")
    .option('-b, --batch-size [batchSize]', "The number of stripe customer to fetch per batch (defaults to 10)")
    .option('--dry-run', "If provided, no actual cancellations take place")
    .parse(process.argv);

    if(!program.batchSize) {
        program.batchSize = 10;
    }
    dryRun = program.dryRun;
    stripe = require('stripe')(program.secretKey);

    Promise.resolve(co((function(_this) {
        return function() {
            return run(program);
        };
    })(this))).then(function(result) {
        logger.info("finished running", result);
        return process.exit(0);
    })["catch"](function(err) {
        logger.error(err);
        return process.exit(1);
    });
}
