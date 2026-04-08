CREATE TABLE credentials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    domain VARCHAR(100),
    username VARCHAR(100) NOT NULL,
    password_encrypted TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE hosts (
    id SERIAL PRIMARY KEY,
    hostname VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL DEFAULT 5985,
    use_https BOOLEAN NOT NULL DEFAULT FALSE,
    credential_id INTEGER NOT NULL REFERENCES credentials(id),
    description VARCHAR(500),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE service_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE monitored_services (
    id SERIAL PRIMARY KEY,
    host_id INTEGER NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES service_groups(id),
    service_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(host_id, service_name)
);

CREATE TABLE service_status_log (
    id SERIAL PRIMARY KEY,
    monitored_service_id INTEGER NOT NULL REFERENCES monitored_services(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    pid INTEGER,
    checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    error_message TEXT
);

CREATE INDEX idx_status_log_service_checked
    ON service_status_log(monitored_service_id, checked_at DESC);

CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    username VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL,
    host_id INTEGER REFERENCES hosts(id) ON DELETE SET NULL,
    service_name VARCHAR(255),
    result VARCHAR(20) NOT NULL,
    error_detail TEXT
);

CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_username ON audit_log(username);
