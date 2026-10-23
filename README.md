# 🦧 Jungle Gaming — Distributed Wagering Processor

A high-precision, low-latency distributed financial service for processing wagering transactions (*betting/iGaming*), built with **NestJS**, **Bun**, **MikroORM v7**, **PostgreSQL**, and **AWS SQS (LocalStack)**.

---

## 🛠️ Technology Stack

* **Runtime & Package Manager**: [Bun 1.x](https://bun.sh/)
* **Language**: TypeScript (Strict Mode)
* **Framework**: [NestJS](https://nestjs.com/)
* **ORM**: [MikroORM v7](https://mikro-orm.io/)
* **Database**: PostgreSQL 16
* **Messaging**: AWS SQS emulated via LocalStack v3.8.0
* **Orchestration & DX**: Docker Compose & VS Code DevContainers

---

## 🏗️ Project Architecture & Layers

The project follows Clean Architecture and Domain-Driven Design (DDD) principles, organized into the following main layers:

* **`src/domain`**: Contains the core of the application, including pure business rules, Value Objects (such as `Money`), Aggregates (`Wallet`, `WagerTransaction`), enums, domain events, and business exceptions. It is independent of frameworks or infrastructure.
* **`src/application`**: Contains use cases, repository ports/interfaces, domain services, and application utilities, orchestrating the flow of business rules.
* **`src/infrastructure`**: Contains concrete implementations and technology adapters, including HTTP controllers (`http/controllers`), DTOs, ORM entities, MikroORM repositories, SQS messaging workers (`inbox` and `outbox`), database configurations, and migrations.

---

## 🔄 Data Flow, Events & API Reference

### 1. Data Input & Output (Payload Contracts)

#### Monetary Values (`Money`)

All monetary inputs and outputs use decimal strings with exactly two decimal places and an ISO-4217 currency code.

Example:

```json
{
  "amount": "25.00",
  "currency": "BRL"
}
```

#### Idempotency

`POST /wagering/transactions` requires the `Idempotency-Key` header.

Recommended format:

```text
{providerId}:{externalTransactionId}
```

* Identical requests return `idempotentReplay: true` when an existing result is replayed.
* Requests using the same idempotency key with conflicting payloads return a failure response.

### 2. Messaging & Event-Driven Architecture (AWS SQS)

#### 📥 Consumed Events (Inbox)

The application polls messages from the AWS SQS FIFO queue through LocalStack.

* **Queue**: `wager-transactions.fifo`
* **Event type**: `WagerTransactionRequested`

The following operations are handled:

| Operation | Behavior |
|---|---|
| `BET` | Debits the wallet balance. Rejected if the balance is insufficient. |
| `WIN` | Credits the wallet balance. May reference a round's `BET`. |
| `LOSS` | Records a round loss without changing the wallet balance. |
| `REFUND` | Reverts a `PROCESSED` `BET` by crediting the balance. |
| `ROLLBACK` | Reverses a previously `PROCESSED` transaction referenced by the request. |

#### 📤 Generated Events (Transactional Outbox)

Domain events are persisted atomically in the database through the Transactional Outbox pattern and published asynchronously.

| Event | When It Is Emitted |
|---|---|
| `WagerTransactionProcessed` | When a transaction is successfully applied, including `LOSS`. |
| `WagerTransactionRejected` | When a transaction fails business validation, such as insufficient balance or an invalid reference. |
| `WalletBalanceChanged` | Only when the wallet balance changes due to a `DEBIT` or `CREDIT`. |
| `WagerTransactionPendingReference` | When an asynchronous operation arrives before its referenced transaction is available. |

### 3. API Endpoints Reference

#### Health Checks (Public)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health/live` | Verifies that the NestJS process is running. |
| `GET` | `/health/ready` | Verifies connectivity with PostgreSQL and LocalStack SQS. |

#### Wallets

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/wallets` | Creates a new wallet for a player. An initial balance greater than zero generates an internal `OPENING` transaction and ledger entry atomically. |
| `GET` | `/wallets/:walletId` | Retrieves wallet details and the current balance. |
| `GET` | `/wallets/:walletId/ledger` | Retrieves the immutable double-entry audit ledger with cursor-based pagination. |
| `POST` | `/wallets/:walletId/reconciliation` | Reconciles the materialized wallet balance against the sum of ledger entries. |

#### Wagering Transactions

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/wagering/transactions` | Submits a wagering operation (`BET`, `WIN`, `LOSS`, `REFUND`, or `ROLLBACK`). Requires the `Idempotency-Key` header. |
| `GET` | `/wagering/transactions/:transactionId` | Retrieves transaction details by internal ID. |
| `GET` | `/providers/:providerId/wagering/transactions/:externalTransactionId` | Retrieves transaction details using the provider's external transaction key. |

---

## 📜 Available Scripts (`package.json`)

You can run the following commands using **Bun**:

| Command | Description |
|---|---|
| `bun run start:dev` | Starts the NestJS application in development mode with hot-reload (`--watch`). |
| `bun run start` | Starts the application in production mode. |
| `bun run build` | Compiles the TypeScript project (`tsc`). |
| `bun run migration:up` | Runs pending MikroORM migrations on the database. |
| `bun run migration:create` | Creates a new blank migration file for MikroORM. |

---

## 🚀 How to Run the Project

### 1. Via DevContainer (Recommended)

1. Open the project folder in VS Code.
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P`) and select **`Dev Containers: Reopen in Container`**.
3. The environment will start up with PostgreSQL, LocalStack, and the application fully configured.

### 2. Manually via Docker Compose

```bash
# Start infrastructure (PostgreSQL + LocalStack)
docker compose -f .devcontainer/docker-compose.yml up -d

# Install dependencies
bun install

# Run migrations
bun run migration:up

# Start the application
bun run start:dev
```
