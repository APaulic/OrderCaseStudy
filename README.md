## Description

An example of a TypeScript-based microservice to manage orders for several storefronts globally, handling millions of
customers,
products, and orders.

### Technologies used for demonstration

- Typescript/NodeJS
- NestJS
- Docker
- PostgreSQL
- Swagger
- Drizzle (ORM)
- Prettier

## Project setup

```bash
$ npm install
$ docker-compose up -d
```

## Compile and run the project

```bash
# Create a .env file
$ cp .env.example .env

# Initialise the DB
$ npm run db:migrate

# development
$ npm run start
```

## Using the APIs

I have included Swagger UI docs for ease of use with this example. You can access these docs
at http://localhost:3000/api

You can also invoke the API endpoints with the below example curl commands:

### `/order/create`

Create a new order for customer `abc123` for a single `prod123`

```bash
curl -X 'POST' \
  'http://localhost:3000/order/create' \
  -H 'accept: application/json' \
  -H 'x-api-key: local-secret-api-key' \
  -H 'Content-Type: application/json' \
  -d '{
  "items": [
    {
      "productId": "prod-123",
      "quantity": 1
    },
    {
      "productId": "prod-456",
      "quantity": 3
    }
  ],
  "customerId": "cus-123"
}'
```

### `/order/{orderId}`

Retrieve an order

```bash
curl -X 'GET' \
  'http://localhost:3000/order/9b8fa4d1-9f7b-4b2a-a806-bf3456e73d25' \
  -H 'accept: application/json' \
  -H 'x-api-key: local-secret-api-key'
```

### `/order/update/{orderId}`

Add shipping details and progress the status

```bash
curl -X 'PUT' \
  'http://localhost:3000/order/update/9b8fa4d1-9f7b-4b2a-a806-bf3456e73d25' \
  -H 'accept: application/json' \
  -H 'x-api-key: local-secret-api-key' \
  -H 'Content-Type: application/json' \
  -d '{
  "customerId": "cus-123",
  "status": "shipped",
  "trackingCompany": "Australia Post",
  "trackingNumber": "EE 999 999 999 AU",
  "trackingLink": "https://auspost.com.au/mypost/track/",
  "items": [
    {
      "productId": "prod-123",
      "quantity": 1
    },
    {
      "productId": "prod-456",
      "quantity": 3
    }
  ]
}'
```

### `/order/delete/{orderId}`

Soft delete the order

```bash
curl -X 'DELETE' \
  'http://localhost:3000/order/delete/9b8fa4d1-9f7b-4b2a-a806-bf3456e73d25' \
  -H 'accept: application/json' \
  -H 'x-api-key: local-secret-api-key'
```

## Considerations

### Event based architecture

I wanted the demonstration to be executable. Therefore, I have proceeded with a hybrid model of event based and atomic
transactions. The intent behind this also includes the ability for the orders to be saved directly to the DB before
continuing so that consumers will always have access to the data without a race condition.

Ideally, we could refactor this to be purely event based where a consumer within this service would pick up
the `order.created` event and then store it in the DB. I would still suggest that the interaction with the
InventoryService should be an API as to once again avoid race conditions with competing orders for a product with a
smaller quantity, as there are millions of orders in the case study.

### Not using AWS in demonstration

I had thoughts to use LocalStack to run AWS infrastructure locally in a docker container, however, this would create
more work for reviewing so I decided to included commented out snippets where AWS interactivity would be required.

Ideally, I would have used:

- SNS to publish events
- SQS to queue events
- RDS for the DB instance to store orders
- API Gateway to expose REST API
- Lambda for NestJS, including webpack to consolidate code to single file
- EventBridge to coordinate event-driven workflow

### Deployment (AWS)

This would be managed or deployed via AWS CDK and something like BuildKite or Jenkins to automate staged deployment to
testing environments before being deployed to prod on successful acceptance of Quality Assurance testing.

### Security

As this system is powering different websites it would make sense to secure it to avoid the public hammering it. I have
included a basic API key for this demonstration, however, given more time I would use role based authentication to
manage and track changes for each entity.

### Caching

This demonstration uses in memory caching provided by NestJS

### Validation

There could be a lot more validation in these endpoints such as valid ID formats for customer, product, etc. There could
also be business logic around enforcing a particular order with status changes.

### Error Handling

I'll admit that there is very little error handling in this example. For example, if the an external service returns
null this could cause issues. Also, if there is no DB this will pretty much fall over.

## Explanation of endpoints

This includes their function, action and limitations

### `/create`

This endpoints is used to create a new Order item. It validates that the product is stock for the specified quantity and
reserves stock.

#### Assumptions:

The InventoryService has the ability to reserve stock for an order where it assigns the stock to the order. This aims to
ensure that the stock will be available at time of payment.

#### Limitations:

- It does NOT handle payment

### `/update`

This endpoint is used to update an existing Order item. This also allows updating the status of the order as well as
adding shipping details

#### Limitations:

- It does NOT handle a change in items of the order
- It does NOT prevent updates to the order if it is at a certain status, i.e. after it has been shipped.

### `/delete`

This endpoints is used to soft delete an order. The idea is that we persist all data as to have a record of the
original.

#### Limitations:

- It does NOT check that the order is already soft deleted

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

