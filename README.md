# image-upload-api

REST API for uploading and serving images. Images are uploaded to S3, resized asynchronously via a BullMQ worker using Sharp, and served through a CDN URL. Metadata is stored in PostgreSQL.

**Endpoints:**

- `POST /images` — upload an image (JPEG, PNG, WebP, GIF), set title, width, height, and fit mode (`cover` / `contain`). Returns immediately with `status: pending`; processing happens in the background.
- `GET /images` — list images with optional title filter and cursor pagination.
- `GET /images/:id` — get a single image by ID.

## Requirements

- Node.js 22+
- Docker

## Setup

```bash
npm install
```

A `.env.development` file with local defaults is included — no extra configuration needed for local development. For other environments, create a `.env` file (takes priority over `.env.development`):

| Variable                     | Description                           |
| ---------------------------- | ------------------------------------- |
| `POSTGRES_CONNECTION_STRING` | PostgreSQL connection URL             |
| `REDIS_HOST`                 | Redis host                            |
| `REDIS_PORT`                 | Redis port                            |
| `AWS_REGION`                 | S3 region                             |
| `AWS_ACCESS_KEY_ID`          | S3 access key                         |
| `AWS_SECRET_ACCESS_KEY`      | S3 secret key                         |
| `AWS_S3_IMAGES_BUCKET`       | S3 bucket name                        |
| `AWS_ENDPOINT`               | S3 endpoint override (LocalStack)     |
| `CDN_BASE_URL`               | Base URL for serving processed images |

## Running locally

Start all services (Postgres, S3, Redis):

```bash
npm run dev:services
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
