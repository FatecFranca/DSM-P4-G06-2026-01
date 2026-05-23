# AgroTech Backend

Node.js + TypeScript backend for the AgroTech IoT greenhouse management platform.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express 4 |
| ORM | Prisma (PostgreSQL) |
| Time-series | InfluxDB 2 |
| Cache / state | Redis |
| Messaging | MQTT (Mosquitto) |
| Realtime | Socket.IO |
| Auth | JWT + bcrypt |
| Validation | Zod |
| Logging | Winston |
| Tests | Vitest |
| Containers | Docker + Docker Compose |

## Project structure

```
src/
├── config/          # env, logger, database clients
├── middlewares/     # auth (JWT + RBAC), errorHandler
├── modules/
│   ├── auth/        # register, login, user management (RN13)
│   ├── greenhouses/ # CRUD + config update → MQTT retain
│   ├── sensors/     # InfluxDB write/query, validation (RN07–09, RN12)
│   ├── actuators/   # manual command + MQTT pub (RN01, RN02)
│   ├── alerts/      # create, ack, resolve, email (RN10, RN11)
│   └── analytics/   # KPIs, charts, downsampling
├── mqtt/
│   ├── mqtt.client.ts    # singleton MQTT connection
│   └── mqtt.handler.ts   # topic routing, threshold checks, heartbeat watchdog
├── realtime/
│   └── socket.server.ts  # Socket.IO auth + greenhouse rooms
├── types/           # shared TS interfaces (payloads, events)
├── app.ts           # Express setup
└── server.ts        # entrypoint, bootstrap, graceful shutdown
```

## Quick start

```bash
# 1. Copy env
cp .env.example .env

# 2. Start infrastructure
docker-compose up postgres influxdb redis mosquitto -d

# 3. Install dependencies
npm install

# 4. Run migrations + generate Prisma client
npm run db:migrate
npm run db:generate

# 5. Start dev server
npm run dev
```

## API endpoints

### Auth
| Method | Path | Role | Description |
|---|---|---|---|
| POST | /auth/login | public | Get JWT token |
| POST | /auth/register | ADMIN | Create user |
| GET | /auth/me | any | Current user |
| GET | /auth/users | ADMIN | List users |
| PATCH | /auth/users/:id/role | ADMIN | Change role |

### Greenhouses
| Method | Path | Role | Description |
|---|---|---|---|
| GET | /greenhouses | any | List all |
| GET | /greenhouses/:id | any | Get details + config |
| POST | /greenhouses | ADMIN | Create + provision actuators |
| PATCH | /greenhouses/:id/config | ADMIN | Update thresholds → publishes MQTT retain |
| DELETE | /greenhouses/:id | ADMIN | Soft delete |

### Sensors
| Method | Path | Role | Description |
|---|---|---|---|
| GET | /sensors/:id/latest | any | Latest reading |
| GET | /sensors/:id/history | any | Time-series (start, end, window params) |

### Actuators
| Method | Path | Role | Description |
|---|---|---|---|
| GET | /actuators/:id | any | List with last 10 logs |
| POST | /actuators/:id/:name/command | ADMIN | Manual command → MQTT |
| GET | /actuators/:id/:actuatorId/logs | any | Audit trail |

### Alerts
| Method | Path | Role | Description |
|---|---|---|---|
| GET | /alerts | any | List (filter by greenhouse, status) |
| PATCH | /alerts/:id/acknowledge | ADMIN | Acknowledge |
| PATCH | /alerts/:id/resolve | ADMIN | Resolve |

### Analytics
| Method | Path | Role | Description |
|---|---|---|---|
| GET | /analytics/:id/kpis | any | 7-day KPIs |
| GET | /analytics/:id/temperature | any | Hourly temp chart |
| GET | /analytics/:id/soil-moisture | any | 30-min soil chart |

## MQTT topics handled

| Direction | Topic | QoS | Handler |
|---|---|---|---|
| Upstream | `agrotech/{id}/sensores/estado` | 0 | Validate → InfluxDB → Socket.IO |
| Upstream | `agrotech/{id}/status/atuadores` | 1 | Sync DB → Socket.IO |
| Upstream | `agrotech/{id}/status/sistema` | 1 | Heartbeat → Redis TTL |
| Downstream | `agrotech/{id}/cmd/{name}` | 1 | Manual command |
| Downstream | `agrotech/{id}/cmd/config` | 1 retain | Config update |

## Business rules implemented

| Rule | Where |
|---|---|
| RN01 Dual mode (auto/manual) | actuators.service |
| RN02 Manual timeout (30 min) | actuators.service |
| RN03 Config retain for offline | greenhouses.service → MQTT retain |
| RN07 60s polling | firmware (ESP32) |
| RN08 Sync on event + periodic | mqtt.handler |
| RN09 Raw 30d, aggregate after | sensors.service.downsampleOldData |
| RN10 Critical alerts after 15 min | mqtt.handler.checkThresholds |
| RN11 Heartbeat offline detection | mqtt.handler.checkHeartbeats |
| RN12 Sensor failure failsafe | sensors.service.validateReading |
| RN13 RBAC (ADMIN/MONITOR) | middlewares/auth.ts |

## Running tests

```bash
npm test
```
