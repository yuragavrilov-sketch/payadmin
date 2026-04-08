# WinRM Service Management Module — Design Spec

## Overview

Add a WinRM-based Windows service management module to PayAdmin. Enables administrators to register Windows hosts, monitor designated services, perform Start/Stop/Restart operations, and maintain a compliance audit log.

## Scope

### In scope
- **Host registry** — CRUD for Windows servers with credential references
- **Credential management** — separate directory of WinRM credentials, AES-encrypted passwords
- **Service group directory** — logical grouping of services (FrontCard, BackCard, etc.)
- **Monitored services** — admin-selected services per host, assigned to groups
- **Service monitoring** — periodic polling via Spring Scheduler, status stored in PostgreSQL
- **Service control** — Start/Stop/Restart via WinRM (winrm4j library)
- **Audit log** — all actions logged with user, timestamp, host, service, result

### Out of scope
- Arbitrary PowerShell/CMD command execution
- Script library
- Email/SMS alerting (future)
- WebSocket real-time updates (UI polls every 30s)

## Architecture

### Databases

**Oracle (existing, read-only)** — AP#MERCHANTS, MERC_CONFIG

**PostgreSQL (new)** — all WinRM module data:
- `credentials` — encrypted WinRM login/password pairs
- `hosts` — registered Windows servers referencing credentials
- `service_groups` — logical groups (FrontCard, BackCard, etc.)
- `monitored_services` — services to monitor, linking host + group
- `service_status_log` — latest and historical status from polling
- `audit_log` — all user actions

### Multi-datasource

Spring Boot configured with two datasources:
- `primary` — Oracle (existing JPA entities: Merchant, MercConfig)
- `management` — PostgreSQL (new JPA entities: Host, Credential, ServiceGroup, MonitoredService, ServiceStatusLog, AuditLog)

Each datasource gets its own `EntityManagerFactory`, `TransactionManager`, and package-scoped entity scan.

### Backend components

| Component | Purpose |
|-----------|---------|
| `CryptoService` | AES-256 encrypt/decrypt using env key `WINRM_ENCRYPTION_KEY` |
| `WinRmService` | winrm4j wrapper — connect, execute PowerShell, parse output |
| `MonitorScheduler` | `@Scheduled` — polls all enabled hosts every N minutes (configurable) |
| `HostController` | CRUD `/api/infra/hosts` |
| `CredentialController` | CRUD `/api/infra/credentials` |
| `ServiceGroupController` | CRUD `/api/infra/service-groups` |
| `MonitoringController` | GET `/api/infra/monitoring` — grouped statuses; POST actions |
| `AuditController` | GET `/api/infra/audit` — filtered, paginated log |

### Frontend pages

| Page | Route | Description |
|------|-------|-------------|
| HostsPage | `/infra/hosts` | Tabs: Servers / Credentials / Service Groups |
| MonitoringPage | `/infra/monitoring` | Collapsible groups, summary cards, Start/Stop/Restart |
| AuditLogPage | `/infra/audit` | Filterable table with pagination |

### Sidebar navigation

New section "Infrastructure" in AppSidebar with items:
- Hosts (`/infra/hosts`)
- Monitoring (`/infra/monitoring`)
- Audit Log (`/infra/audit`)

Visible only to users with `WINRM_ADMIN` role.

## Data Model

### credentials
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| name | VARCHAR(100) | Display name, e.g. "svc_admin_prod" |
| domain | VARCHAR(100) | Windows domain, e.g. "CORP" |
| username | VARCHAR(100) | e.g. "svc_paygate" |
| password_encrypted | TEXT | AES-256 encrypted |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### hosts
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| hostname | VARCHAR(255) | FQDN or IP |
| port | INTEGER | Default 5985 (HTTP) or 5986 (HTTPS) |
| use_https | BOOLEAN | Default false |
| credential_id | FK → credentials | |
| description | VARCHAR(500) | Optional |
| enabled | BOOLEAN | Default true |
| last_seen | TIMESTAMP | Last successful WinRM connection |
| created_at | TIMESTAMP | |

### service_groups
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| name | VARCHAR(100) | e.g. "FrontCard", "BackCard" |
| description | VARCHAR(500) | e.g. "Приём карточных транзакций" |
| sort_order | INTEGER | Display order |
| created_at | TIMESTAMP | |

### monitored_services
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| host_id | FK → hosts | |
| group_id | FK → service_groups | |
| service_name | VARCHAR(255) | Windows service name (e.g. "FrontCardService") |
| display_name | VARCHAR(255) | Optional friendly name |
| created_at | TIMESTAMP | |

### service_status_log
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| monitored_service_id | FK → monitored_services | |
| status | VARCHAR(20) | Running, Stopped, StartPending, StopPending, Unknown |
| pid | INTEGER | Process ID if running |
| checked_at | TIMESTAMP | When this status was polled |
| error_message | TEXT | If host unreachable or WinRM error |

### audit_log
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| timestamp | TIMESTAMP | |
| username | VARCHAR(100) | Keycloak preferred_username |
| action | VARCHAR(20) | START, STOP, RESTART, HOST_ADD, HOST_DELETE, CRED_ADD, CRED_DELETE, SERVICE_ADD, SERVICE_DELETE |
| host_id | FK → hosts (nullable) | |
| service_name | VARCHAR(255) | Nullable |
| result | VARCHAR(20) | Success, Failed |
| error_detail | TEXT | Error message if failed |

## Security

### RBAC
- New Keycloak role: `WINRM_ADMIN`
- All `/api/infra/**` endpoints require `WINRM_ADMIN` role via `@PreAuthorize`
- Sidebar "Infrastructure" section visible only with this role

### Credential encryption
- AES-256-GCM encryption for passwords
- Key from environment variable `WINRM_ENCRYPTION_KEY`
- Application fails to start if key is not set and management datasource is configured
- Passwords never returned in API responses — only `name` and `domain\username`

### Audit
- Every mutation (service control, CRUD) logged to `audit_log`
- Username extracted from JWT token
- Includes both success and failure with error details

## WinRM Integration

### Library
`winrm4j` (io.cloudsoft.windows:winrm4j)

### PowerShell commands
| Operation | Command |
|-----------|---------|
| Get service status | `Get-Service -Name '{name}' \| Select-Object Status,Id \| ConvertTo-Json` |
| Start service | `Start-Service -Name '{name}'` |
| Stop service | `Stop-Service -Name '{name}' -Force` |
| Restart service | `Restart-Service -Name '{name}' -Force` |

### Connection handling
- Connection per request (no persistent sessions)
- Configurable timeout (default 30s)
- Credentials decrypted at connection time, not cached in memory

## Monitoring

### Scheduler
- `@Scheduled(fixedDelayString = "${winrm.monitor.interval:60000}")`
- Iterates all enabled hosts, all monitored services per host
- Updates `service_status_log` with latest status
- Sets `hosts.last_seen` on successful connection
- On connection failure: status = "Unknown", error_message populated

### UI polling
- MonitoringPage auto-refreshes every 30 seconds via `setInterval` + API call
- Shows "Last poll: X seconds ago" from latest `service_status_log.checked_at`

### Status retention
- Keep last 7 days of `service_status_log` records
- Scheduled cleanup job removes older records
- `audit_log` retained indefinitely

## UI Details

### Hosts Page (3 tabs)

**Servers tab:**
- Table: hostname, port, credential (badge), services count, status (Online/Offline), actions (edit/delete)
- Add Server dialog: hostname, port, HTTPS toggle, credential dropdown, description
- Edit/Delete with confirmation

**Credentials tab:**
- Table: name, domain\username, used by (host count), actions
- Add Credential dialog: name, domain, username, password
- Delete blocked if referenced by hosts

**Service Groups tab:**
- Table: name, description, services count, sort order, actions
- Add/Edit/Delete with drag-to-reorder or sort_order field

### Monitoring Page

- Summary cards: Total / Running / Stopped / Unreachable
- Filter dropdowns: group, status
- Collapsible groups ordered by `service_groups.sort_order`
- Groups with problems (stopped/unreachable) auto-expanded
- Healthy groups auto-collapsed
- Each service row: host, service name, status badge, info (PID/uptime), action buttons
- Actions visible only with WINRM_ADMIN role
- Confirmation dialog for Stop/Restart

### Audit Log Page

- Table: timestamp, user, action (color-coded badge), host, service, result
- Filters: date range, user, action type
- Pagination (20 per page)

## Docker Integration

### docker-compose additions

```yaml
postgres:
  image: postgres:16-alpine
  environment:
    POSTGRES_DB: payadmin_mgmt
    POSTGRES_USER: ${POSTGRES_USER:-payadmin}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  volumes:
    - pgdata:/var/lib/postgresql/data
  expose:
    - "5432"
```

Backend environment additions:
```yaml
MGMT_DATASOURCE_URL: jdbc:postgresql://postgres:5432/payadmin_mgmt
MGMT_DATASOURCE_USERNAME: ${POSTGRES_USER:-payadmin}
MGMT_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD}
WINRM_ENCRYPTION_KEY: ${WINRM_ENCRYPTION_KEY}
```

### Schema management
- Flyway for PostgreSQL migrations (separate from Oracle)
- Migration scripts in `src/main/resources/db/migration/management/`

## Dependencies (new)

### Backend
- `io.cloudsoft.windows:winrm4j` — WinRM client
- `org.postgresql:postgresql` — PostgreSQL driver
- `org.flywaydb:flyway-core` — schema migrations
- `org.flywaydb:flyway-database-postgresql` — Flyway PostgreSQL support

### Frontend
- No new dependencies (uses existing Tailwind, React Router, Lucide icons)
