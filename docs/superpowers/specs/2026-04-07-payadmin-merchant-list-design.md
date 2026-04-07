# PayAdmin — Merchant List & Authentication

**Date:** 2026-04-07
**Status:** Approved

## Overview

Admin panel for a payment gateway. First iteration: authentication via Keycloak and a read-only merchant list with detail view.

## Architecture

Two Docker containers orchestrated with docker-compose:

1. **Frontend** — nginx serving a React SPA; proxies `/api/*` to the backend
2. **Backend** — Spring Boot REST API (OAuth2 Resource Server)

External services (already deployed):

- **Keycloak** — OpenID Connect provider, federated with corporate LDAP/AD
- **Oracle DB** — existing database with merchant data
- **LDAP/AD** — user directory (behind Keycloak)

```
┌──────────┐     ┌───────────────┐     ┌──────────┐     ┌────────┐
│ Browser  │────▶│ nginx         │────▶│ Spring   │────▶│ Oracle │
│ React    │     │ static +proxy │     │ Boot API │     │  DB    │
└──────────┘     └───────────────┘     └──────────┘     └────────┘
     │                                      │
     │           ┌───────────────┐          │
     └──────────▶│  Keycloak     │◀─────────┘
    OIDC login   │  (OIDC/OAuth2)│     token validation
                 └───────┬───────┘
                         │
                    ┌────┴────┐
                    │ LDAP/AD │
                    └─────────┘
```

## Authentication

- React renders its own login form (not Keycloak's hosted page).
- On submit, React calls Keycloak's token endpoint using **Direct Access Grant** (Resource Owner Password Credentials flow): `POST /realms/{realm}/protocol/openid-connect/token`.
- Keycloak validates credentials against LDAP/AD.
- Keycloak returns JWT (access token + refresh token).
- React stores tokens in memory (not localStorage) and sends `Authorization: Bearer <access_token>` with every API request.
- Spring Boot validates the JWT signature via Keycloak's JWKS endpoint (`/realms/{realm}/protocol/openid-connect/certs`).
- On token expiry, React uses the refresh token to obtain a new access token silently.

## Authorization (RBAC)

Three roles managed in Keycloak (realm or client roles):

| Role     | Permissions                          |
|----------|--------------------------------------|
| VIEWER   | Read-only access to merchants        |
| OPERATOR | Read + edit (future)                 |
| ADMIN    | Full access + user management (future) |

Roles are extracted from the JWT claims (`realm_access.roles` or `resource_access.<client>.roles`). Spring Security maps them to granted authorities.

For this iteration all three roles have read-only access. Role-based restrictions will matter when editing is introduced.

## Database Schema (Existing)

### AP#MERCHANTS

```sql
CREATE TABLE AP#MERCHANTS (
  MERCID        INTEGER NOT NULL,
  NAME          VARCHAR2(256 BYTE) NOT NULL,
  HIERARCHYID   INTEGER,
  PALOGIN       VARCHAR2(16 BYTE),
  PAPASSWORD    VARCHAR2(16 BYTE),
  APILOGIN      VARCHAR2(16 BYTE),
  APIPASSWORD   VARCHAR2(256 BYTE),
  INITIATOR     VARCHAR2(64 BYTE) NOT NULL,
  CIRCUIT       VARCHAR2(8 BYTE)
);
```

### MERC_CONFIG

```sql
CREATE TABLE MERC_CONFIG (
  MERCID         NUMBER,
  PARAMETERNAME   VARCHAR2(32 BYTE) NOT NULL,
  PARAMETERVALUE  VARCHAR2(128 BYTE) NOT NULL,
  DATEBEGIN       DATE DEFAULT sysdate,
  DATEEND         DATE DEFAULT to_date('01.01.2050','dd.mm.yyyy')
);
```

## Backend

### Tech Stack

- Java 17+
- Spring Boot 3.x
- Spring Security OAuth2 Resource Server
- Spring Data JPA
- Oracle JDBC driver (ojdbc11)

### Package Structure

```
com.payadmin
├── config/          # SecurityConfig, CorsConfig
├── controller/      # MerchantController
├── dto/             # MerchantDto, MerchantConfigDto, PageResponse
├── entity/          # Merchant, MercConfig
├── repository/      # MerchantRepository, MercConfigRepository
└── service/         # MerchantService
```

### Entity Mapping

**Merchant** → `AP#MERCHANTS`

- All columns mapped except `PAPASSWORD` and `APIPASSWORD` are never exposed in DTOs.
- `PALOGIN` and `APILOGIN` are included in detail DTO only (not in list DTO).

**MercConfig** → `MERC_CONFIG`

- Only records where `DATEBEGIN <= SYSDATE AND DATEEND > SYSDATE` are returned (active configuration).

### API Endpoints

| Method | URL                          | Description                              | Roles                    |
|--------|------------------------------|------------------------------------------|--------------------------|
| GET    | `/api/merchants`             | Paginated merchant list with search      | VIEWER, OPERATOR, ADMIN  |
| GET    | `/api/merchants/{id}`        | Merchant details                         | VIEWER, OPERATOR, ADMIN  |
| GET    | `/api/merchants/{id}/config` | Active configuration for a merchant      | VIEWER, OPERATOR, ADMIN  |

**Pagination:** `?page=0&size=20&sort=mercid,asc`

**Search:** `?search=term` — searches by MERCID (exact match if numeric) and NAME (case-insensitive LIKE `%term%`).

### DTOs

**MerchantListDto** (used in list endpoint):

```
mercid: Integer
name: String
initiator: String
circuit: String
hierarchyId: Integer
```

**MerchantDetailDto** (used in detail endpoint):

```
mercid: Integer
name: String
initiator: String
circuit: String
hierarchyId: Integer
paLogin: String
apiLogin: String
```

**MerchantConfigDto** (used in config endpoint):

```
parameterName: String
parameterValue: String
dateBegin: LocalDate
dateEnd: LocalDate
```

## Frontend

### Tech Stack

- React 18+ with TypeScript
- Vite (build tool)
- Tailwind CSS
- shadcn/ui components (Table, Dialog, Input, Button, Sidebar, Pagination)
- React Router (navigation)

### Pages & Components

**Login Page** (`/login`)

- Centered card with logo, username/password fields, sign-in button.
- Subtitle: "Authenticated via corporate LDAP".
- On submit: call Keycloak token endpoint, store JWT, redirect to `/merchants`.

**Merchant List Page** (`/merchants`)

- Layout: collapsible icon sidebar (left) + main content area.
- Sidebar items: Merchants (active), Transactions (placeholder), Settings (placeholder).
- User avatar + role badge at bottom of sidebar.
- Search input: searches by ID or name, debounced (300ms).
- Table columns: MERC ID, NAME, INITIATOR, CIRCUIT (color-coded badge), HIERARCHY ID.
- Pagination: page numbers + prev/next, 20 items per page.
- Row click: opens merchant detail modal.

**Merchant Detail Modal**

- shadcn/ui Dialog component, centered.
- Header: merchant name + MERC ID + close button.
- Info grid: Circuit (badge), Initiator, Hierarchy ID, PA Login, API Login.
- Configuration section: list of active parameters as cards (parameter name, value, date range).

### Visual Style

- Light corporate theme.
- Background: `#f8fafc`, cards: `#ffffff`, borders: `#e2e8f0`.
- Primary accent: blue (`#2563eb`).
- Circuit badges: VISA — blue (`#dbeafe`/`#1d4ed8`), MC — amber (`#fef3c7`/`#92400e`), MIR — green (`#d1fae5`/`#065f46`).
- Rounded corners (8–12px), subtle shadows.
- Collapsible sidebar: 52px collapsed (icons only), expands on hover with labels.

## Docker Compose

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:oracle:thin:@//host:port/service
      - SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI=https://keycloak-host/realms/realm-name
```

Keycloak and Oracle are external — not included in compose.

## Out of Scope (Future Iterations)

- Merchant create/edit/deactivate
- Transaction list and details
- User management in admin panel
- Audit logging
- Dark theme toggle
- Export (CSV/Excel)
