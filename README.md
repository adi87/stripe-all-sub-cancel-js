# stripe-all-sub-cancel-js
Package to cancel all subscriptions in a stripe account

## Dependencies
- Node.js [v6.5.0 or later]
- NPM

## Installation
```
npm install -g git+https://github.com/adi87/stripe-all-sub-cancel-js
```

## Running the program

##### CLI Arguments
- `--secret-key [secretKey]`: The Secret Key for the parent Stripe account to cancel the subscriptions for
- `--dry-run`: If passed, the execution will be a dry run where no subscription cancellation will actually take place. It will just run through the list of customers and their active subscriptions. Recommended for a first run to verify correct setup.
- `--batch-size [batchSize]`: The number of Stripe customers to fetch per batch (defaults to 10)

##### Sample command

```
stripe-all-sub-cancel --secret-key MY_STRIPE_SECRET_KEY --batch-size 20 --dry-run
```

## Debug
To turn on debug logging, ensure environment variable DEBUG is set to true;

```
export DEBUG=true;
```