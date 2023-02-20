<div align="center">
  <a href="https://macrosifter.com">
    <img
      alt="Macrosifter Logo"
      src="https://macrosifter.com/assets/macrosifter_logo.png"
      width="100"
    />
  </a>

  <h1>Macrosifter</h1>
  <p>
    <strong>MacroSifter is an investment management software</strong>
  </p>
  <p>
    <a href="https://macrosifter.com"><strong>macrosifter.com</strong></a>
  </p>
  
</div>

MacroSifter is an investment management software created for individuals interested in enterprise-grade portfolio management. We make it easy for you to connect, track, and analyze your investments across various asset classes.


<div align="center" style="margin-top: 1rem; margin-bottom: 1rem;">
  <img src="https://macrosifter.com/assets/macrosifter_logo.png" width="300">
</div>

## Technology Stack

Macrosifter is a modern web application written in [TypeScript](https://www.typescriptlang.org) and organized as an [Nx](https://nx.dev) workspace.

### Backend

The backend is based on [NestJS](https://nestjs.com) using [PostgreSQL](https://www.postgresql.org) as a database together with [Prisma](https://www.prisma.io) and [Redis](https://redis.io) for caching.

### Frontend

The frontend is built with [Angular](https://angular.io) and uses [Angular Material](https://material.angular.io) with utility classes from [Bootstrap](https://getbootstrap.com).

## Self-hosting

We provide official container images hosted on [Docker Hub](https://hub.docker.com/r/Macrosifter/Macrosifter) for `linux/amd64` and `linux/arm64`.

### Supported Environment Variables

| Name                | Default Value | Description                                                                                                                         |
| ------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `ACCESS_TOKEN_SALT` |               | A random string used as salt for access tokens                                                                                      |
| `BASE_CURRENCY`     | `USD`         | The base currency of the Macrosifter application. Caution: This cannot be changed later!                                             |
| `DATABASE_URL`      |               | The database connection URL, e.g. `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?sslmode=prefer` |
| `HOST`              | `0.0.0.0`     | The host where the Macrosifter application will run on                                                                               |
| `JWT_SECRET_KEY`    |               | A random string used for _JSON Web Tokens_ (JWT)                                                                                    |
| `PORT`              | `3333`        | The port where the Macrosifter application will run on                                                                               |
| `POSTGRES_DB`       |               | The name of the _PostgreSQL_ database                                                                                               |
| `POSTGRES_PASSWORD` |               | The password of the _PostgreSQL_ database                                                                                           |
| `POSTGRES_USER`     |               | The user of the _PostgreSQL_ database                                                                                               |
| `REDIS_HOST`        |               | The host where _Redis_ is running                                                                                                   |
| `REDIS_PASSWORD`    |               | The password of _Redis_                                                                                                             |
| `REDIS_PORT`        |               | The port where _Redis_ is running                                                                                                   |

### Run with Docker Compose

#### Prerequisites

- Basic knowledge of Docker
- Installation of [Docker](https://www.docker.com/products/docker-desktop)
- Local copy of this Git repository (clone)

#### a. Run environment

Run the following command to start the Docker images from [Docker Hub](https://hub.docker.com/r/Macrosifter/Macrosifter):

```bash
docker-compose --env-file ./.env -f docker/docker-compose.yml up -d
```

#### b. Build and run environment

Run the following commands to build and start the Docker images:

```bash
docker-compose --env-file ./.env -f docker/docker-compose.build.yml build
docker-compose --env-file ./.env -f docker/docker-compose.build.yml up -d
```

#### Fetch Historical Data

Open http://localhost:3333 in your browser and accomplish these steps:

1. Create a new user via _Get Started_ (this first user will get the role `ADMIN`)
1. Go to the _Admin Control Panel_ and click _Gather All Data_ to fetch historical data
1. Click _Sign out_ and check out the _Live Demo_

#### Upgrade Version

1. Increase the version of the `Macrosifter/Macrosifter` Docker image in `docker/docker-compose.yml`
1. Run the following command to start the new Docker image: `docker-compose --env-file ./.env -f docker/docker-compose.yml up -d`  
   At each start, the container will automatically apply the database schema migrations if needed.

### Run with _Unraid_ (Community)

Please follow the instructions of the Macrosifter [Unraid Community App](https://unraid.net/community/apps?q=Macrosifter).

## Development

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop)
- [Node.js](https://nodejs.org/en/download) (version 16+)
- [Yarn](https://yarnpkg.com/en/docs/install)
- A local copy of this Git repository (clone)

### Setup

1. Run `yarn install`
1. Run `yarn build:dev` to build the source code including the assets
1. Run `docker-compose --env-file ./.env -f docker/docker-compose.dev.yml up -d` to start [PostgreSQL](https://www.postgresql.org) and [Redis](https://redis.io)
1. Run `yarn database:setup` to initialize the database schema and populate your database with (example) data
1. Start the server and the client (see [_Development_](#Development))
1. Create a new user via _Get Started_ (this first user will get the role `ADMIN`)
1. Go to the _Admin Control Panel_ and click _Gather All Data_ to fetch historical data
1. Click _Sign out_ and check out the _Live Demo_

### Start Server

<ol type="a">
  <li>Debug: Run <code>yarn watch:server</code> and click "Launch Program" in <a href="https://code.visualstudio.com">Visual Studio Code</a></li>
  <li>Serve: Run <code>yarn start:server</code></li>
</ol>

### Start Client

Run `yarn start:client`

### Start _Storybook_

Run `yarn start:storybook`

### Migrate Database

With the following command you can keep your database schema in sync:

```bash
yarn database:push
```

## Testing

Run `yarn test`

## Public API

### Import Activities

#### Request

`POST http://localhost:3333/api/v1/import`

#### Authorization: Bearer Token

Set the header as follows:

```
"Authorization": "Bearer eyJh..."
```

#### Body

```
{
  "activities": [
    {
      "currency": "USD",
      "dataSource": "YAHOO",
      "date": "2021-09-15T00:00:00.000Z",
      "fee": 19,
      "quantity": 5,
      "symbol": "MSFT"
      "type": "BUY",
      "unitPrice": 298.58
    }
  ]
}
```

| Field      | Type                | Description                                        |
| ---------- | ------------------- | -------------------------------------------------- |
| accountId  | string (`optional`) | Id of the account                                  |
| currency   | string              | `CHF` \| `EUR` \| `USD` etc.                       |
| dataSource | string              | `MANUAL` (for type `ITEM`) \| `YAHOO`              |
| date       | string              | Date in the format `ISO-8601`                      |
| fee        | number              | Fee of the activity                                |
| quantity   | number              | Quantity of the activity                           |
| symbol     | string              | Symbol of the activity (suitable for `dataSource`) |
| type       | string              | `BUY` \| `DIVIDEND` \| `ITEM` \| `SELL`            |
| unitPrice  | number              | Price per unit of the activity                     |

#### Response

##### Success

`201 Created`

##### Error

`400 Bad Request`

```
{
  "error": "Bad Request",
  "message": [
    "activities.1 is a duplicate activity"
  ]
}
```


## License

© 2022 [Macrosifter](https://macrosifter.com/home) 