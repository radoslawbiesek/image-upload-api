# image-upload-api

## Requirements

- Node.js 22+
- Docker

## Setup

```bash
cp .env.example .env
npm install
```

## Running locally

Start Postgres and LocalStack (S3):

```bash
npm run db:dev
npm run storage:dev
```

Run database migrations:

```bash
npm run db:migrate
```

Start the dev server:

```bash
npm run start:dev
```

API docs available at `http://localhost:3000/docs`.

## Tests

```bash
npm run test:e2e
```
