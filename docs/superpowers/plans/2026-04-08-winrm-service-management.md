# WinRM Service Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Windows service management via WinRM to PayAdmin — host registry, credential management, service monitoring, Start/Stop/Restart control, and audit logging.

**Architecture:** Dual-datasource Spring Boot (Oracle for merchants, PostgreSQL for management). WinRM via winrm4j. Flyway migrations for PostgreSQL. React frontend with 3 new pages in "Infrastructure" sidebar section. RBAC via `WINRM_ADMIN` Keycloak role.

**Tech Stack:** Spring Boot 3.4, PostgreSQL 16, Flyway, winrm4j, React 18, Tailwind CSS v3, Vite

---

## File Map

### Backend — New Files

```
backend/src/main/java/com/payadmin/
├── config/
│   ├── OracleDataSourceConfig.java        # Primary datasource (Oracle)
│   └── ManagementDataSourceConfig.java    # Management datasource (PostgreSQL)
├── infra/
│   ├── entity/
│   │   ├── Credential.java
│   │   ├── Host.java
│   │   ├── ServiceGroup.java
│   │   ├── MonitoredService.java
│   │   ├── ServiceStatusLog.java
│   │   └── AuditLog.java
│   ├── repository/
│   │   ├── CredentialRepository.java
│   │   ├── HostRepository.java
│   │   ├── ServiceGroupRepository.java
│   │   ├── MonitoredServiceRepository.java
│   │   ├── ServiceStatusLogRepository.java
│   │   └── AuditLogRepository.java
│   ├── dto/
│   │   ├── CredentialDto.java
│   │   ├── CredentialCreateDto.java
│   │   ├── HostDto.java
│   │   ├── HostCreateDto.java
│   │   ├── ServiceGroupDto.java
│   │   ├── ServiceGroupCreateDto.java
│   │   ├── MonitoredServiceDto.java
│   │   ├── MonitoredServiceCreateDto.java
│   │   ├── MonitoringGroupDto.java
│   │   ├── MonitoringServiceDto.java
│   │   ├── ServiceActionDto.java
│   │   └── AuditLogDto.java
│   ├── service/
│   │   ├── CryptoService.java
│   │   ├── WinRmService.java
│   │   ├── CredentialService.java
│   │   ├── HostService.java
│   │   ├── ServiceGroupService.java
│   │   ├── MonitoredServiceService.java
│   │   ├── MonitoringService.java
│   │   ├── AuditService.java
│   │   └── MonitorScheduler.java
│   └── controller/
│       ├── CredentialController.java
│       ├── HostController.java
│       ├── ServiceGroupController.java
│       ├── MonitoringController.java
│       └── AuditController.java

backend/src/main/resources/
└── db/migration/management/
    └── V1__init_schema.sql

backend/src/test/java/com/payadmin/infra/
├── service/
│   ├── CryptoServiceTest.java
│   ├── CredentialServiceTest.java
│   ├── HostServiceTest.java
│   └── MonitoringServiceTest.java
└── controller/
    ├── CredentialControllerTest.java
    ├── HostControllerTest.java
    └── MonitoringControllerTest.java
```

### Backend — Modified Files

```
backend/pom.xml                            # Add PostgreSQL, Flyway, winrm4j deps
backend/src/main/resources/application.yml # Add management datasource, winrm config
backend/src/main/java/com/payadmin/config/SecurityConfig.java  # Add /api/infra/** auth
docker-compose.yml                         # Add postgres service
```

### Frontend — New Files

```
frontend/src/
├── pages/
│   ├── HostsPage.tsx
│   ├── MonitoringPage.tsx
│   └── AuditLogPage.tsx
├── components/
│   ├── HostsServersTab.tsx
│   ├── HostsCredentialsTab.tsx
│   ├── HostsServiceGroupsTab.tsx
│   ├── MonitoringGroup.tsx
│   ├── StatusBadge.tsx
│   └── ActionBadge.tsx
├── hooks/
│   ├── useHosts.ts
│   ├── useCredentials.ts
│   ├── useServiceGroups.ts
│   ├── useMonitoring.ts
│   └── useAuditLog.ts
└── lib/
    └── infra-types.ts
```

### Frontend — Modified Files

```
frontend/src/App.tsx                    # Add infra routes
frontend/src/components/AppSidebar.tsx  # Add Infrastructure section
```

---

## Task 1: Add Dependencies and PostgreSQL Datasource

**Files:**
- Modify: `backend/pom.xml`
- Create: `backend/src/main/java/com/payadmin/config/OracleDataSourceConfig.java`
- Create: `backend/src/main/java/com/payadmin/config/ManagementDataSourceConfig.java`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/main/resources/application-local.yml`

- [ ] **Step 1: Add dependencies to pom.xml**

Add inside `<dependencies>`:

```xml
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
<dependency>
    <groupId>io.cloudsoft.windows</groupId>
    <artifactId>winrm4j</artifactId>
    <version>0.12.3</version>
</dependency>
```

- [ ] **Step 2: Create Oracle datasource config**

```java
package com.payadmin.config;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.Map;

@Configuration
@EnableJpaRepositories(
        basePackages = "com.payadmin.repository",
        entityManagerFactoryRef = "oracleEntityManagerFactory",
        transactionManagerRef = "oracleTransactionManager"
)
public class OracleDataSourceConfig {

    @Primary
    @Bean
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties oracleDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Primary
    @Bean
    public DataSource oracleDataSource() {
        return oracleDataSourceProperties().initializeDataSourceBuilder().build();
    }

    @Primary
    @Bean
    public LocalContainerEntityManagerFactoryBean oracleEntityManagerFactory(
            EntityManagerFactoryBuilder builder) {
        return builder
                .dataSource(oracleDataSource())
                .packages("com.payadmin.entity")
                .persistenceUnit("oracle")
                .properties(Map.of(
                        "hibernate.hbm2ddl.auto", "none",
                        "hibernate.physical_naming_strategy",
                        "org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl"
                ))
                .build();
    }

    @Primary
    @Bean
    public PlatformTransactionManager oracleTransactionManager(
            @Qualifier("oracleEntityManagerFactory") EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}
```

- [ ] **Step 3: Create Management datasource config**

```java
package com.payadmin.config;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.Map;

@Configuration
@EnableJpaRepositories(
        basePackages = "com.payadmin.infra.repository",
        entityManagerFactoryRef = "managementEntityManagerFactory",
        transactionManagerRef = "managementTransactionManager"
)
public class ManagementDataSourceConfig {

    @Bean
    @ConfigurationProperties("spring.management-datasource")
    public DataSourceProperties managementDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    public DataSource managementDataSource() {
        return managementDataSourceProperties().initializeDataSourceBuilder().build();
    }

    @Bean
    public LocalContainerEntityManagerFactoryBean managementEntityManagerFactory(
            EntityManagerFactoryBuilder builder) {
        return builder
                .dataSource(managementDataSource())
                .packages("com.payadmin.infra.entity")
                .persistenceUnit("management")
                .properties(Map.of("hibernate.hbm2ddl.auto", "validate"))
                .build();
    }

    @Bean
    public PlatformTransactionManager managementTransactionManager(
            @Qualifier("managementEntityManagerFactory") EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}
```

- [ ] **Step 4: Update application.yml**

Add management datasource and Flyway config after existing Oracle config:

```yaml
  management-datasource:
    url: ${MGMT_DATASOURCE_URL}
    username: ${MGMT_DATASOURCE_USERNAME}
    password: ${MGMT_DATASOURCE_PASSWORD}
    driver-class-name: org.postgresql.Driver
  flyway:
    enabled: true
    url: ${MGMT_DATASOURCE_URL}
    user: ${MGMT_DATASOURCE_USERNAME}
    password: ${MGMT_DATASOURCE_PASSWORD}
    locations: classpath:db/migration/management
    baseline-on-migrate: true

winrm:
  encryption-key: ${WINRM_ENCRYPTION_KEY}
  monitor:
    interval: ${WINRM_MONITOR_INTERVAL:60000}
    timeout: ${WINRM_TIMEOUT:30000}
```

- [ ] **Step 5: Update application-local.yml**

Add local PostgreSQL defaults:

```yaml
  management-datasource:
    url: jdbc:postgresql://localhost:5432/payadmin_mgmt
    username: payadmin
    password: payadmin

winrm:
  encryption-key: dev-key-minimum-16-chars
```

- [ ] **Step 6: Verify compilation**

Run: `cd backend && ./mvnw compile -q`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add backend/pom.xml backend/src/main/java/com/payadmin/config/OracleDataSourceConfig.java backend/src/main/java/com/payadmin/config/ManagementDataSourceConfig.java backend/src/main/resources/application.yml backend/src/main/resources/application-local.yml
git commit -m "feat: add PostgreSQL dual-datasource and WinRM dependencies"
```

---

## Task 2: Flyway Migration and JPA Entities

**Files:**
- Create: `backend/src/main/resources/db/migration/management/V1__init_schema.sql`
- Create: `backend/src/main/java/com/payadmin/infra/entity/Credential.java`
- Create: `backend/src/main/java/com/payadmin/infra/entity/Host.java`
- Create: `backend/src/main/java/com/payadmin/infra/entity/ServiceGroup.java`
- Create: `backend/src/main/java/com/payadmin/infra/entity/MonitoredService.java`
- Create: `backend/src/main/java/com/payadmin/infra/entity/ServiceStatusLog.java`
- Create: `backend/src/main/java/com/payadmin/infra/entity/AuditLog.java`

- [ ] **Step 1: Create Flyway migration V1**

```sql
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
```

- [ ] **Step 2: Create Credential entity**

```java
package com.payadmin.infra.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "credentials")
public class Credential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(length = 100)
    private String domain;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(name = "password_encrypted", nullable = false, columnDefinition = "TEXT")
    private String passwordEncrypted;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Getters and setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPasswordEncrypted() { return passwordEncrypted; }
    public void setPasswordEncrypted(String passwordEncrypted) { this.passwordEncrypted = passwordEncrypted; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

- [ ] **Step 3: Create Host entity**

```java
package com.payadmin.infra.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "hosts")
public class Host {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 255)
    private String hostname;

    @Column(nullable = false)
    private Integer port = 5985;

    @Column(name = "use_https", nullable = false)
    private Boolean useHttps = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credential_id", nullable = false)
    private Credential credential;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(name = "last_seen")
    private LocalDateTime lastSeen;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getHostname() { return hostname; }
    public void setHostname(String hostname) { this.hostname = hostname; }
    public Integer getPort() { return port; }
    public void setPort(Integer port) { this.port = port; }
    public Boolean getUseHttps() { return useHttps; }
    public void setUseHttps(Boolean useHttps) { this.useHttps = useHttps; }
    public Credential getCredential() { return credential; }
    public void setCredential(Credential credential) { this.credential = credential; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public LocalDateTime getLastSeen() { return lastSeen; }
    public void setLastSeen(LocalDateTime lastSeen) { this.lastSeen = lastSeen; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
```

- [ ] **Step 4: Create ServiceGroup entity**

```java
package com.payadmin.infra.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_groups")
public class ServiceGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
```

- [ ] **Step 5: Create MonitoredService entity**

```java
package com.payadmin.infra.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "monitored_services",
       uniqueConstraints = @UniqueConstraint(columns = {"host_id", "service_name"}))
public class MonitoredService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", nullable = false)
    private Host host;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private ServiceGroup group;

    @Column(name = "service_name", nullable = false, length = 255)
    private String serviceName;

    @Column(name = "display_name", length = 255)
    private String displayName;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Host getHost() { return host; }
    public void setHost(Host host) { this.host = host; }
    public ServiceGroup getGroup() { return group; }
    public void setGroup(ServiceGroup group) { this.group = group; }
    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
```

- [ ] **Step 6: Create ServiceStatusLog entity**

```java
package com.payadmin.infra.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_status_log")
public class ServiceStatusLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "monitored_service_id", nullable = false)
    private MonitoredService monitoredService;

    @Column(nullable = false, length = 20)
    private String status;

    private Integer pid;

    @Column(name = "checked_at", nullable = false)
    private LocalDateTime checkedAt = LocalDateTime.now();

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public MonitoredService getMonitoredService() { return monitoredService; }
    public void setMonitoredService(MonitoredService monitoredService) { this.monitoredService = monitoredService; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getPid() { return pid; }
    public void setPid(Integer pid) { this.pid = pid; }
    public LocalDateTime getCheckedAt() { return checkedAt; }
    public void setCheckedAt(LocalDateTime checkedAt) { this.checkedAt = checkedAt; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
```

- [ ] **Step 7: Create AuditLog entity**

```java
package com.payadmin.infra.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(nullable = false, length = 100)
    private String username;

    @Column(nullable = false, length = 20)
    private String action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id")
    private Host host;

    @Column(name = "service_name", length = 255)
    private String serviceName;

    @Column(nullable = false, length = 20)
    private String result;

    @Column(name = "error_detail", columnDefinition = "TEXT")
    private String errorDetail;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public Host getHost() { return host; }
    public void setHost(Host host) { this.host = host; }
    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
    public String getErrorDetail() { return errorDetail; }
    public void setErrorDetail(String errorDetail) { this.errorDetail = errorDetail; }
}
```

- [ ] **Step 8: Verify compilation**

Run: `cd backend && ./mvnw compile -q`
Expected: No errors

- [ ] **Step 9: Commit**

```bash
git add backend/src/main/resources/db/migration/ backend/src/main/java/com/payadmin/infra/entity/
git commit -m "feat: add Flyway migration and JPA entities for management DB"
```

---

## Task 3: Repositories and CryptoService

**Files:**
- Create: `backend/src/main/java/com/payadmin/infra/repository/CredentialRepository.java`
- Create: `backend/src/main/java/com/payadmin/infra/repository/HostRepository.java`
- Create: `backend/src/main/java/com/payadmin/infra/repository/ServiceGroupRepository.java`
- Create: `backend/src/main/java/com/payadmin/infra/repository/MonitoredServiceRepository.java`
- Create: `backend/src/main/java/com/payadmin/infra/repository/ServiceStatusLogRepository.java`
- Create: `backend/src/main/java/com/payadmin/infra/repository/AuditLogRepository.java`
- Create: `backend/src/main/java/com/payadmin/infra/service/CryptoService.java`
- Create: `backend/src/test/java/com/payadmin/infra/service/CryptoServiceTest.java`

- [ ] **Step 1: Create all repositories**

CredentialRepository:
```java
package com.payadmin.infra.repository;

import com.payadmin.infra.entity.Credential;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CredentialRepository extends JpaRepository<Credential, Integer> {
}
```

HostRepository:
```java
package com.payadmin.infra.repository;

import com.payadmin.infra.entity.Host;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HostRepository extends JpaRepository<Host, Integer> {
    List<Host> findByEnabledTrue();
    long countByCredentialId(Integer credentialId);
}
```

ServiceGroupRepository:
```java
package com.payadmin.infra.repository;

import com.payadmin.infra.entity.ServiceGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServiceGroupRepository extends JpaRepository<ServiceGroup, Integer> {
    List<ServiceGroup> findAllByOrderBySortOrderAsc();
}
```

MonitoredServiceRepository:
```java
package com.payadmin.infra.repository;

import com.payadmin.infra.entity.MonitoredService;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MonitoredServiceRepository extends JpaRepository<MonitoredService, Integer> {
    List<MonitoredService> findByHostId(Integer hostId);
    long countByGroupId(Integer groupId);
    long countByHostId(Integer hostId);
}
```

ServiceStatusLogRepository:
```java
package com.payadmin.infra.repository;

import com.payadmin.infra.entity.ServiceStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.Optional;

public interface ServiceStatusLogRepository extends JpaRepository<ServiceStatusLog, Long> {
    Optional<ServiceStatusLog> findTopByMonitoredServiceIdOrderByCheckedAtDesc(Integer monitoredServiceId);

    @Modifying
    @Query("DELETE FROM ServiceStatusLog s WHERE s.checkedAt < :before")
    void deleteOlderThan(LocalDateTime before);
}
```

AuditLogRepository:
```java
package com.payadmin.infra.repository;

import com.payadmin.infra.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:from IS NULL OR a.timestamp >= :from) AND " +
           "(:to IS NULL OR a.timestamp <= :to) AND " +
           "(:username IS NULL OR a.username = :username) AND " +
           "(:action IS NULL OR a.action = :action) " +
           "ORDER BY a.timestamp DESC")
    Page<AuditLog> findFiltered(LocalDateTime from, LocalDateTime to,
                                String username, String action, Pageable pageable);
}
```

- [ ] **Step 2: Write CryptoService test**

```java
package com.payadmin.infra.service;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CryptoServiceTest {

    private final CryptoService cryptoService = new CryptoService("test-key-at-least-16chars!");

    @Test
    void encryptAndDecrypt_roundTrip() {
        String plaintext = "my-secret-password";
        String encrypted = cryptoService.encrypt(plaintext);

        assertThat(encrypted).isNotEqualTo(plaintext);
        assertThat(cryptoService.decrypt(encrypted)).isEqualTo(plaintext);
    }

    @Test
    void encrypt_producesDifferentCiphertexts() {
        String encrypted1 = cryptoService.encrypt("password");
        String encrypted2 = cryptoService.encrypt("password");

        assertThat(encrypted1).isNotEqualTo(encrypted2);
    }

    @Test
    void decrypt_withWrongKey_throws() {
        String encrypted = cryptoService.encrypt("secret");
        CryptoService other = new CryptoService("different-key-16chars!!");

        assertThatThrownBy(() -> other.decrypt(encrypted))
                .isInstanceOf(RuntimeException.class);
    }
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && ./mvnw test -pl . -Dtest=CryptoServiceTest -q`
Expected: FAIL — class not found

- [ ] **Step 4: Implement CryptoService**

```java
package com.payadmin.infra.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

@Service
public class CryptoService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int IV_LENGTH = 12;

    private final SecretKey secretKey;

    public CryptoService(@Value("${winrm.encryption-key}") String key) {
        try {
            byte[] keyBytes = MessageDigest.getInstance("SHA-256")
                    .digest(key.getBytes(StandardCharsets.UTF_8));
            this.secretKey = new SecretKeySpec(Arrays.copyOf(keyBytes, 32), "AES");
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize encryption key", e);
        }
    }

    public String encrypt(String plaintext) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[IV_LENGTH + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, IV_LENGTH);
            System.arraycopy(encrypted, 0, combined, IV_LENGTH, encrypted.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public String decrypt(String ciphertext) {
        try {
            byte[] combined = Base64.getDecoder().decode(ciphertext);
            byte[] iv = Arrays.copyOfRange(combined, 0, IV_LENGTH);
            byte[] encrypted = Arrays.copyOfRange(combined, IV_LENGTH, combined.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] decrypted = cipher.doFinal(encrypted);

            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && ./mvnw test -pl . -Dtest=CryptoServiceTest -q`
Expected: 3 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/payadmin/infra/repository/ backend/src/main/java/com/payadmin/infra/service/CryptoService.java backend/src/test/java/com/payadmin/infra/
git commit -m "feat: add repositories and AES-256-GCM CryptoService with tests"
```

---

## Task 4: DTOs and Credential/Host/ServiceGroup Services

**Files:**
- Create: all DTOs in `backend/src/main/java/com/payadmin/infra/dto/`
- Create: `backend/src/main/java/com/payadmin/infra/service/AuditService.java`
- Create: `backend/src/main/java/com/payadmin/infra/service/CredentialService.java`
- Create: `backend/src/main/java/com/payadmin/infra/service/HostService.java`
- Create: `backend/src/main/java/com/payadmin/infra/service/ServiceGroupService.java`
- Create: `backend/src/main/java/com/payadmin/infra/service/MonitoredServiceService.java`
- Create: `backend/src/test/java/com/payadmin/infra/service/CredentialServiceTest.java`
- Create: `backend/src/test/java/com/payadmin/infra/service/HostServiceTest.java`

- [ ] **Step 1: Create DTOs**

CredentialDto (response — no password):
```java
package com.payadmin.infra.dto;

public record CredentialDto(Integer id, String name, String domain, String username, long hostCount) {}
```

CredentialCreateDto (request):
```java
package com.payadmin.infra.dto;

import jakarta.validation.constraints.NotBlank;

public record CredentialCreateDto(
        @NotBlank String name,
        String domain,
        @NotBlank String username,
        @NotBlank String password
) {}
```

HostDto:
```java
package com.payadmin.infra.dto;

import java.time.LocalDateTime;

public record HostDto(
        Integer id, String hostname, Integer port, Boolean useHttps,
        Integer credentialId, String credentialName,
        String description, Boolean enabled,
        LocalDateTime lastSeen, long serviceCount
) {}
```

HostCreateDto:
```java
package com.payadmin.infra.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record HostCreateDto(
        @NotBlank String hostname,
        @NotNull Integer port,
        Boolean useHttps,
        @NotNull Integer credentialId,
        String description
) {}
```

ServiceGroupDto:
```java
package com.payadmin.infra.dto;

public record ServiceGroupDto(Integer id, String name, String description, Integer sortOrder, long serviceCount) {}
```

ServiceGroupCreateDto:
```java
package com.payadmin.infra.dto;

import jakarta.validation.constraints.NotBlank;

public record ServiceGroupCreateDto(@NotBlank String name, String description, Integer sortOrder) {}
```

MonitoredServiceDto:
```java
package com.payadmin.infra.dto;

public record MonitoredServiceDto(Integer id, Integer hostId, String hostname, Integer groupId, String groupName, String serviceName, String displayName) {}
```

MonitoredServiceCreateDto:
```java
package com.payadmin.infra.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MonitoredServiceCreateDto(@NotNull Integer hostId, @NotNull Integer groupId, @NotBlank String serviceName, String displayName) {}
```

MonitoringGroupDto:
```java
package com.payadmin.infra.dto;

import java.util.List;

public record MonitoringGroupDto(Integer groupId, String groupName, String groupDescription, List<MonitoringServiceDto> services, long runningCount, long stoppedCount, long unreachableCount) {}
```

MonitoringServiceDto:
```java
package com.payadmin.infra.dto;

import java.time.LocalDateTime;

public record MonitoringServiceDto(Integer serviceId, String serviceName, String displayName, Integer hostId, String hostname, String status, Integer pid, LocalDateTime checkedAt, String errorMessage) {}
```

ServiceActionDto:
```java
package com.payadmin.infra.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ServiceActionDto(@NotNull Integer serviceId, @NotBlank String action) {}
```

AuditLogDto:
```java
package com.payadmin.infra.dto;

import java.time.LocalDateTime;

public record AuditLogDto(Long id, LocalDateTime timestamp, String username, String action, String hostname, String serviceName, String result, String errorDetail) {}
```

- [ ] **Step 2: Create AuditService**

```java
package com.payadmin.infra.service;

import com.payadmin.infra.entity.AuditLog;
import com.payadmin.infra.entity.Host;
import com.payadmin.infra.repository.AuditLogRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional("managementTransactionManager")
    public void log(String action, Host host, String serviceName, String result, String errorDetail) {
        AuditLog entry = new AuditLog();
        entry.setUsername(getCurrentUsername());
        entry.setAction(action);
        entry.setHost(host);
        entry.setServiceName(serviceName);
        entry.setResult(result);
        entry.setErrorDetail(errorDetail);
        auditLogRepository.save(entry);
    }

    private String getCurrentUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }
}
```

- [ ] **Step 3: Create CredentialService**

```java
package com.payadmin.infra.service;

import com.payadmin.infra.dto.CredentialCreateDto;
import com.payadmin.infra.dto.CredentialDto;
import com.payadmin.infra.entity.Credential;
import com.payadmin.infra.repository.CredentialRepository;
import com.payadmin.infra.repository.HostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(value = "managementTransactionManager", readOnly = true)
public class CredentialService {

    private final CredentialRepository credentialRepository;
    private final HostRepository hostRepository;
    private final CryptoService cryptoService;
    private final AuditService auditService;

    public CredentialService(CredentialRepository credentialRepository,
                             HostRepository hostRepository,
                             CryptoService cryptoService,
                             AuditService auditService) {
        this.credentialRepository = credentialRepository;
        this.hostRepository = hostRepository;
        this.cryptoService = cryptoService;
        this.auditService = auditService;
    }

    public List<CredentialDto> findAll() {
        return credentialRepository.findAll().stream()
                .map(c -> new CredentialDto(c.getId(), c.getName(), c.getDomain(), c.getUsername(),
                        hostRepository.countByCredentialId(c.getId())))
                .toList();
    }

    @Transactional("managementTransactionManager")
    public CredentialDto create(CredentialCreateDto dto) {
        Credential c = new Credential();
        c.setName(dto.name());
        c.setDomain(dto.domain());
        c.setUsername(dto.username());
        c.setPasswordEncrypted(cryptoService.encrypt(dto.password()));
        c = credentialRepository.save(c);
        auditService.log("CRED_ADD", null, null, "Success", null);
        return new CredentialDto(c.getId(), c.getName(), c.getDomain(), c.getUsername(), 0);
    }

    @Transactional("managementTransactionManager")
    public void delete(Integer id) {
        long count = hostRepository.countByCredentialId(id);
        if (count > 0) {
            throw new IllegalStateException("Credential is used by " + count + " host(s)");
        }
        credentialRepository.deleteById(id);
        auditService.log("CRED_DELETE", null, null, "Success", null);
    }
}
```

- [ ] **Step 4: Create HostService**

```java
package com.payadmin.infra.service;

import com.payadmin.infra.dto.HostCreateDto;
import com.payadmin.infra.dto.HostDto;
import com.payadmin.infra.entity.Credential;
import com.payadmin.infra.entity.Host;
import com.payadmin.infra.repository.CredentialRepository;
import com.payadmin.infra.repository.HostRepository;
import com.payadmin.infra.repository.MonitoredServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(value = "managementTransactionManager", readOnly = true)
public class HostService {

    private final HostRepository hostRepository;
    private final CredentialRepository credentialRepository;
    private final MonitoredServiceRepository monitoredServiceRepository;
    private final AuditService auditService;

    public HostService(HostRepository hostRepository,
                       CredentialRepository credentialRepository,
                       MonitoredServiceRepository monitoredServiceRepository,
                       AuditService auditService) {
        this.hostRepository = hostRepository;
        this.credentialRepository = credentialRepository;
        this.monitoredServiceRepository = monitoredServiceRepository;
        this.auditService = auditService;
    }

    public List<HostDto> findAll() {
        return hostRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional("managementTransactionManager")
    public HostDto create(HostCreateDto dto) {
        Credential credential = credentialRepository.findById(dto.credentialId())
                .orElseThrow(() -> new IllegalArgumentException("Credential not found"));
        Host h = new Host();
        h.setHostname(dto.hostname());
        h.setPort(dto.port());
        h.setUseHttps(dto.useHttps() != null ? dto.useHttps() : false);
        h.setCredential(credential);
        h.setDescription(dto.description());
        h = hostRepository.save(h);
        auditService.log("HOST_ADD", h, null, "Success", null);
        return toDto(h);
    }

    @Transactional("managementTransactionManager")
    public void delete(Integer id) {
        Host host = hostRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Host not found"));
        hostRepository.delete(host);
        auditService.log("HOST_DELETE", null, null, "Success", null);
    }

    private HostDto toDto(Host h) {
        return new HostDto(h.getId(), h.getHostname(), h.getPort(), h.getUseHttps(),
                h.getCredential().getId(), h.getCredential().getName(),
                h.getDescription(), h.getEnabled(), h.getLastSeen(),
                monitoredServiceRepository.countByHostId(h.getId()));
    }
}
```

- [ ] **Step 5: Create ServiceGroupService**

```java
package com.payadmin.infra.service;

import com.payadmin.infra.dto.ServiceGroupCreateDto;
import com.payadmin.infra.dto.ServiceGroupDto;
import com.payadmin.infra.entity.ServiceGroup;
import com.payadmin.infra.repository.MonitoredServiceRepository;
import com.payadmin.infra.repository.ServiceGroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(value = "managementTransactionManager", readOnly = true)
public class ServiceGroupService {

    private final ServiceGroupRepository serviceGroupRepository;
    private final MonitoredServiceRepository monitoredServiceRepository;

    public ServiceGroupService(ServiceGroupRepository serviceGroupRepository,
                               MonitoredServiceRepository monitoredServiceRepository) {
        this.serviceGroupRepository = serviceGroupRepository;
        this.monitoredServiceRepository = monitoredServiceRepository;
    }

    public List<ServiceGroupDto> findAll() {
        return serviceGroupRepository.findAllByOrderBySortOrderAsc().stream()
                .map(g -> new ServiceGroupDto(g.getId(), g.getName(), g.getDescription(),
                        g.getSortOrder(), monitoredServiceRepository.countByGroupId(g.getId())))
                .toList();
    }

    @Transactional("managementTransactionManager")
    public ServiceGroupDto create(ServiceGroupCreateDto dto) {
        ServiceGroup g = new ServiceGroup();
        g.setName(dto.name());
        g.setDescription(dto.description());
        g.setSortOrder(dto.sortOrder() != null ? dto.sortOrder() : 0);
        g = serviceGroupRepository.save(g);
        return new ServiceGroupDto(g.getId(), g.getName(), g.getDescription(), g.getSortOrder(), 0);
    }

    @Transactional("managementTransactionManager")
    public void delete(Integer id) {
        long count = monitoredServiceRepository.countByGroupId(id);
        if (count > 0) {
            throw new IllegalStateException("Group has " + count + " service(s)");
        }
        serviceGroupRepository.deleteById(id);
    }
}
```

- [ ] **Step 6: Create MonitoredServiceService**

```java
package com.payadmin.infra.service;

import com.payadmin.infra.dto.MonitoredServiceCreateDto;
import com.payadmin.infra.dto.MonitoredServiceDto;
import com.payadmin.infra.entity.Host;
import com.payadmin.infra.entity.MonitoredService;
import com.payadmin.infra.entity.ServiceGroup;
import com.payadmin.infra.repository.HostRepository;
import com.payadmin.infra.repository.MonitoredServiceRepository;
import com.payadmin.infra.repository.ServiceGroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(value = "managementTransactionManager", readOnly = true)
public class MonitoredServiceService {

    private final MonitoredServiceRepository monitoredServiceRepository;
    private final HostRepository hostRepository;
    private final ServiceGroupRepository serviceGroupRepository;
    private final AuditService auditService;

    public MonitoredServiceService(MonitoredServiceRepository monitoredServiceRepository,
                                   HostRepository hostRepository,
                                   ServiceGroupRepository serviceGroupRepository,
                                   AuditService auditService) {
        this.monitoredServiceRepository = monitoredServiceRepository;
        this.hostRepository = hostRepository;
        this.serviceGroupRepository = serviceGroupRepository;
        this.auditService = auditService;
    }

    public List<MonitoredServiceDto> findByHost(Integer hostId) {
        return monitoredServiceRepository.findByHostId(hostId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional("managementTransactionManager")
    public MonitoredServiceDto create(MonitoredServiceCreateDto dto) {
        Host host = hostRepository.findById(dto.hostId())
                .orElseThrow(() -> new IllegalArgumentException("Host not found"));
        ServiceGroup group = serviceGroupRepository.findById(dto.groupId())
                .orElseThrow(() -> new IllegalArgumentException("Service group not found"));

        MonitoredService ms = new MonitoredService();
        ms.setHost(host);
        ms.setGroup(group);
        ms.setServiceName(dto.serviceName());
        ms.setDisplayName(dto.displayName());
        ms = monitoredServiceRepository.save(ms);
        auditService.log("SERVICE_ADD", host, dto.serviceName(), "Success", null);
        return toDto(ms);
    }

    @Transactional("managementTransactionManager")
    public void delete(Integer id) {
        MonitoredService ms = monitoredServiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Monitored service not found"));
        auditService.log("SERVICE_DELETE", ms.getHost(), ms.getServiceName(), "Success", null);
        monitoredServiceRepository.delete(ms);
    }

    private MonitoredServiceDto toDto(MonitoredService ms) {
        return new MonitoredServiceDto(ms.getId(), ms.getHost().getId(), ms.getHost().getHostname(),
                ms.getGroup().getId(), ms.getGroup().getName(), ms.getServiceName(), ms.getDisplayName());
    }
}
```

- [ ] **Step 7: Write CredentialService test**

```java
package com.payadmin.infra.service;

import com.payadmin.infra.dto.CredentialCreateDto;
import com.payadmin.infra.dto.CredentialDto;
import com.payadmin.infra.entity.Credential;
import com.payadmin.infra.repository.CredentialRepository;
import com.payadmin.infra.repository.HostRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CredentialServiceTest {

    @Mock private CredentialRepository credentialRepository;
    @Mock private HostRepository hostRepository;
    @Mock private CryptoService cryptoService;
    @Mock private AuditService auditService;
    @InjectMocks private CredentialService credentialService;

    @Test
    void create_encryptsPasswordAndSaves() {
        when(cryptoService.encrypt("secret")).thenReturn("encrypted_secret");
        Credential saved = new Credential();
        saved.setId(1);
        saved.setName("prod");
        saved.setDomain("CORP");
        saved.setUsername("admin");
        saved.setPasswordEncrypted("encrypted_secret");
        when(credentialRepository.save(any())).thenReturn(saved);

        CredentialDto result = credentialService.create(
                new CredentialCreateDto("prod", "CORP", "admin", "secret"));

        assertThat(result.id()).isEqualTo(1);
        assertThat(result.name()).isEqualTo("prod");
    }

    @Test
    void delete_blockedWhenUsedByHosts() {
        when(hostRepository.countByCredentialId(1)).thenReturn(2L);

        assertThatThrownBy(() -> credentialService.delete(1))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("2 host(s)");
    }
}
```

- [ ] **Step 8: Run tests**

Run: `cd backend && ./mvnw test -pl . -Dtest="CryptoServiceTest,CredentialServiceTest" -q`
Expected: All tests PASS

- [ ] **Step 9: Commit**

```bash
git add backend/src/main/java/com/payadmin/infra/dto/ backend/src/main/java/com/payadmin/infra/service/ backend/src/test/java/com/payadmin/infra/
git commit -m "feat: add DTOs, CryptoService, and CRUD services for credentials/hosts/groups"
```

---

## Task 5: WinRM Service, Monitoring Service, and Scheduler

**Files:**
- Create: `backend/src/main/java/com/payadmin/infra/service/WinRmService.java`
- Create: `backend/src/main/java/com/payadmin/infra/service/MonitoringService.java`
- Create: `backend/src/main/java/com/payadmin/infra/service/MonitorScheduler.java`

- [ ] **Step 1: Create WinRmService**

```java
package com.payadmin.infra.service;

import io.cloudsoft.winrm4j.client.WinRmClient;
import io.cloudsoft.winrm4j.client.ShellCommand;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class WinRmService {

    private static final Logger log = LoggerFactory.getLogger(WinRmService.class);

    @Value("${winrm.monitor.timeout:30000}")
    private int timeout;

    public record CommandResult(int exitCode, String stdout, String stderr) {}

    public CommandResult execute(String hostname, int port, boolean useHttps,
                                  String domain, String username, String password,
                                  String command) {
        String protocol = useHttps ? "https" : "http";
        String url = protocol + "://" + hostname + ":" + port + "/wsman";
        String fullUsername = domain != null && !domain.isEmpty()
                ? domain + "\\" + username : username;

        try {
            WinRmClient client = WinRmClient.builder(url)
                    .credentials(fullUsername, password)
                    .disableCertificateChecks(useHttps)
                    .operationTimeout(timeout)
                    .build();

            ShellCommand shell = client.createShell();
            ShellCommand.Result result = shell.execute("powershell.exe -Command \"" +
                    command.replace("\"", "\\\"") + "\"");

            String stdout = result.getStdOut() != null ? result.getStdOut().trim() : "";
            String stderr = result.getStdErr() != null ? result.getStdErr().trim() : "";
            int exitCode = result.getStatusCode();
            shell.close();

            return new CommandResult(exitCode, stdout, stderr);
        } catch (Exception e) {
            log.error("WinRM error on {}: {}", hostname, e.getMessage());
            throw new RuntimeException("WinRM connection failed: " + e.getMessage(), e);
        }
    }
}
```

- [ ] **Step 2: Create MonitoringService**

```java
package com.payadmin.infra.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.payadmin.infra.dto.*;
import com.payadmin.infra.entity.*;
import com.payadmin.infra.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(value = "managementTransactionManager", readOnly = true)
public class MonitoringService {

    private static final Logger log = LoggerFactory.getLogger(MonitoringService.class);

    private final MonitoredServiceRepository monitoredServiceRepository;
    private final ServiceStatusLogRepository statusLogRepository;
    private final ServiceGroupRepository serviceGroupRepository;
    private final HostRepository hostRepository;
    private final CredentialRepository credentialRepository;
    private final WinRmService winRmService;
    private final CryptoService cryptoService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MonitoringService(MonitoredServiceRepository monitoredServiceRepository,
                             ServiceStatusLogRepository statusLogRepository,
                             ServiceGroupRepository serviceGroupRepository,
                             HostRepository hostRepository,
                             CredentialRepository credentialRepository,
                             WinRmService winRmService,
                             CryptoService cryptoService,
                             AuditService auditService) {
        this.monitoredServiceRepository = monitoredServiceRepository;
        this.statusLogRepository = statusLogRepository;
        this.serviceGroupRepository = serviceGroupRepository;
        this.hostRepository = hostRepository;
        this.credentialRepository = credentialRepository;
        this.winRmService = winRmService;
        this.cryptoService = cryptoService;
        this.auditService = auditService;
    }

    public List<MonitoringGroupDto> getGroupedStatus() {
        List<ServiceGroup> groups = serviceGroupRepository.findAllByOrderBySortOrderAsc();
        List<MonitoredService> allServices = monitoredServiceRepository.findAll();

        Map<Integer, List<MonitoredService>> byGroup = allServices.stream()
                .collect(Collectors.groupingBy(s -> s.getGroup().getId()));

        List<MonitoringGroupDto> result = new ArrayList<>();
        for (ServiceGroup group : groups) {
            List<MonitoredService> services = byGroup.getOrDefault(group.getId(), List.of());
            List<MonitoringServiceDto> serviceDtos = services.stream()
                    .map(this::toMonitoringDto)
                    .toList();

            long running = serviceDtos.stream().filter(s -> "Running".equals(s.status())).count();
            long stopped = serviceDtos.stream().filter(s -> "Stopped".equals(s.status())).count();
            long unreachable = serviceDtos.stream().filter(s -> "Unknown".equals(s.status())).count();

            result.add(new MonitoringGroupDto(group.getId(), group.getName(),
                    group.getDescription(), serviceDtos, running, stopped, unreachable));
        }
        return result;
    }

    @Transactional("managementTransactionManager")
    public String executeAction(Integer serviceId, String action) {
        MonitoredService ms = monitoredServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found"));
        Host host = ms.getHost();
        Credential cred = host.getCredential();
        String password = cryptoService.decrypt(cred.getPasswordEncrypted());

        String command = switch (action.toUpperCase()) {
            case "START" -> "Start-Service -Name '" + ms.getServiceName() + "'";
            case "STOP" -> "Stop-Service -Name '" + ms.getServiceName() + "' -Force";
            case "RESTART" -> "Restart-Service -Name '" + ms.getServiceName() + "' -Force";
            default -> throw new IllegalArgumentException("Invalid action: " + action);
        };

        try {
            WinRmService.CommandResult result = winRmService.execute(
                    host.getHostname(), host.getPort(), host.getUseHttps(),
                    cred.getDomain(), cred.getUsername(), password, command);

            if (result.exitCode() == 0) {
                auditService.log(action.toUpperCase(), host, ms.getServiceName(), "Success", null);
                return "Success";
            } else {
                String error = result.stderr().isEmpty() ? "Exit code: " + result.exitCode() : result.stderr();
                auditService.log(action.toUpperCase(), host, ms.getServiceName(), "Failed", error);
                return "Failed: " + error;
            }
        } catch (Exception e) {
            auditService.log(action.toUpperCase(), host, ms.getServiceName(), "Failed", e.getMessage());
            return "Failed: " + e.getMessage();
        }
    }

    @Transactional("managementTransactionManager")
    public void pollHost(Host host) {
        Credential cred = host.getCredential();
        String password = cryptoService.decrypt(cred.getPasswordEncrypted());
        List<MonitoredService> services = monitoredServiceRepository.findByHostId(host.getId());

        for (MonitoredService ms : services) {
            ServiceStatusLog statusLog = new ServiceStatusLog();
            statusLog.setMonitoredService(ms);

            try {
                String command = "Get-Service -Name '" + ms.getServiceName() +
                        "' | Select-Object Status,@{N='Id';E={$_.ServiceHandle}} | ConvertTo-Json";
                WinRmService.CommandResult result = winRmService.execute(
                        host.getHostname(), host.getPort(), host.getUseHttps(),
                        cred.getDomain(), cred.getUsername(), password, command);

                if (result.exitCode() == 0 && !result.stdout().isEmpty()) {
                    JsonNode json = objectMapper.readTree(result.stdout());
                    statusLog.setStatus(json.path("Status").asText("Unknown"));
                    int pid = json.path("Id").asInt(0);
                    if (pid > 0) statusLog.setPid(pid);
                } else {
                    statusLog.setStatus("Unknown");
                    statusLog.setErrorMessage(result.stderr());
                }

                host.setLastSeen(LocalDateTime.now());
                hostRepository.save(host);
            } catch (Exception e) {
                statusLog.setStatus("Unknown");
                statusLog.setErrorMessage(e.getMessage());
            }

            statusLogRepository.save(statusLog);
        }
    }

    private MonitoringServiceDto toMonitoringDto(MonitoredService ms) {
        var latest = statusLogRepository
                .findTopByMonitoredServiceIdOrderByCheckedAtDesc(ms.getId())
                .orElse(null);
        return new MonitoringServiceDto(
                ms.getId(), ms.getServiceName(), ms.getDisplayName(),
                ms.getHost().getId(), ms.getHost().getHostname(),
                latest != null ? latest.getStatus() : "Unknown",
                latest != null ? latest.getPid() : null,
                latest != null ? latest.getCheckedAt() : null,
                latest != null ? latest.getErrorMessage() : null
        );
    }
}
```

- [ ] **Step 3: Create MonitorScheduler**

```java
package com.payadmin.infra.service;

import com.payadmin.infra.entity.Host;
import com.payadmin.infra.repository.HostRepository;
import com.payadmin.infra.repository.ServiceStatusLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@EnableScheduling
public class MonitorScheduler {

    private static final Logger log = LoggerFactory.getLogger(MonitorScheduler.class);

    private final HostRepository hostRepository;
    private final MonitoringService monitoringService;
    private final ServiceStatusLogRepository statusLogRepository;

    public MonitorScheduler(HostRepository hostRepository,
                            MonitoringService monitoringService,
                            ServiceStatusLogRepository statusLogRepository) {
        this.hostRepository = hostRepository;
        this.monitoringService = monitoringService;
        this.statusLogRepository = statusLogRepository;
    }

    @Scheduled(fixedDelayString = "${winrm.monitor.interval:60000}")
    public void pollAllHosts() {
        List<Host> hosts = hostRepository.findByEnabledTrue();
        log.info("Polling {} enabled hosts", hosts.size());
        for (Host host : hosts) {
            try {
                monitoringService.pollHost(host);
            } catch (Exception e) {
                log.error("Failed to poll host {}: {}", host.getHostname(), e.getMessage());
            }
        }
    }

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional("managementTransactionManager")
    public void cleanupOldStatusLogs() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
        statusLogRepository.deleteOlderThan(cutoff);
        log.info("Cleaned up status logs older than {}", cutoff);
    }
}
```

- [ ] **Step 4: Verify compilation**

Run: `cd backend && ./mvnw compile -q`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/payadmin/infra/service/WinRmService.java backend/src/main/java/com/payadmin/infra/service/MonitoringService.java backend/src/main/java/com/payadmin/infra/service/MonitorScheduler.java
git commit -m "feat: add WinRM client, monitoring service, and scheduled poller"
```

---

## Task 6: REST Controllers and Security

**Files:**
- Create: `backend/src/main/java/com/payadmin/infra/controller/CredentialController.java`
- Create: `backend/src/main/java/com/payadmin/infra/controller/HostController.java`
- Create: `backend/src/main/java/com/payadmin/infra/controller/ServiceGroupController.java`
- Create: `backend/src/main/java/com/payadmin/infra/controller/MonitoringController.java`
- Create: `backend/src/main/java/com/payadmin/infra/controller/AuditController.java`
- Modify: `backend/src/main/java/com/payadmin/config/SecurityConfig.java`

- [ ] **Step 1: Create CredentialController**

```java
package com.payadmin.infra.controller;

import com.payadmin.infra.dto.CredentialCreateDto;
import com.payadmin.infra.dto.CredentialDto;
import com.payadmin.infra.service.CredentialService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/infra/credentials")
@PreAuthorize("hasRole('WINRM_ADMIN')")
public class CredentialController {

    private final CredentialService credentialService;

    public CredentialController(CredentialService credentialService) {
        this.credentialService = credentialService;
    }

    @GetMapping
    public List<CredentialDto> list() {
        return credentialService.findAll();
    }

    @PostMapping
    public CredentialDto create(@Valid @RequestBody CredentialCreateDto dto) {
        return credentialService.create(dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        credentialService.delete(id);
    }
}
```

- [ ] **Step 2: Create HostController**

```java
package com.payadmin.infra.controller;

import com.payadmin.infra.dto.*;
import com.payadmin.infra.service.HostService;
import com.payadmin.infra.service.MonitoredServiceService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/infra/hosts")
@PreAuthorize("hasRole('WINRM_ADMIN')")
public class HostController {

    private final HostService hostService;
    private final MonitoredServiceService monitoredServiceService;

    public HostController(HostService hostService, MonitoredServiceService monitoredServiceService) {
        this.hostService = hostService;
        this.monitoredServiceService = monitoredServiceService;
    }

    @GetMapping
    public List<HostDto> list() {
        return hostService.findAll();
    }

    @PostMapping
    public HostDto create(@Valid @RequestBody HostCreateDto dto) {
        return hostService.create(dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        hostService.delete(id);
    }

    @GetMapping("/{id}/services")
    public List<MonitoredServiceDto> listServices(@PathVariable Integer id) {
        return monitoredServiceService.findByHost(id);
    }

    @PostMapping("/{id}/services")
    public MonitoredServiceDto addService(@PathVariable Integer id,
                                          @Valid @RequestBody MonitoredServiceCreateDto dto) {
        return monitoredServiceService.create(dto);
    }

    @DeleteMapping("/{hostId}/services/{serviceId}")
    public void removeService(@PathVariable Integer serviceId) {
        monitoredServiceService.delete(serviceId);
    }
}
```

- [ ] **Step 3: Create ServiceGroupController**

```java
package com.payadmin.infra.controller;

import com.payadmin.infra.dto.ServiceGroupCreateDto;
import com.payadmin.infra.dto.ServiceGroupDto;
import com.payadmin.infra.service.ServiceGroupService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/infra/service-groups")
@PreAuthorize("hasRole('WINRM_ADMIN')")
public class ServiceGroupController {

    private final ServiceGroupService serviceGroupService;

    public ServiceGroupController(ServiceGroupService serviceGroupService) {
        this.serviceGroupService = serviceGroupService;
    }

    @GetMapping
    public List<ServiceGroupDto> list() {
        return serviceGroupService.findAll();
    }

    @PostMapping
    public ServiceGroupDto create(@Valid @RequestBody ServiceGroupCreateDto dto) {
        return serviceGroupService.create(dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        serviceGroupService.delete(id);
    }
}
```

- [ ] **Step 4: Create MonitoringController**

```java
package com.payadmin.infra.controller;

import com.payadmin.infra.dto.MonitoringGroupDto;
import com.payadmin.infra.dto.ServiceActionDto;
import com.payadmin.infra.service.MonitoringService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/infra/monitoring")
@PreAuthorize("hasRole('WINRM_ADMIN')")
public class MonitoringController {

    private final MonitoringService monitoringService;

    public MonitoringController(MonitoringService monitoringService) {
        this.monitoringService = monitoringService;
    }

    @GetMapping
    public List<MonitoringGroupDto> getStatus() {
        return monitoringService.getGroupedStatus();
    }

    @PostMapping("/action")
    public Map<String, String> executeAction(@Valid @RequestBody ServiceActionDto dto) {
        String result = monitoringService.executeAction(dto.serviceId(), dto.action());
        return Map.of("result", result);
    }
}
```

- [ ] **Step 5: Create AuditController**

```java
package com.payadmin.infra.controller;

import com.payadmin.infra.dto.AuditLogDto;
import com.payadmin.infra.entity.AuditLog;
import com.payadmin.infra.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/infra/audit")
@PreAuthorize("hasRole('WINRM_ADMIN')")
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    public AuditController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public Page<AuditLogDto> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action,
            Pageable pageable) {
        return auditLogRepository.findFiltered(from, to, username, action, pageable)
                .map(this::toDto);
    }

    private AuditLogDto toDto(AuditLog a) {
        return new AuditLogDto(a.getId(), a.getTimestamp(), a.getUsername(), a.getAction(),
                a.getHost() != null ? a.getHost().getHostname() : null,
                a.getServiceName(), a.getResult(), a.getErrorDetail());
    }
}
```

- [ ] **Step 6: Update SecurityConfig — add /api/infra/** and POST/PUT/DELETE methods**

In `SecurityConfig.java`, update the `authorizeHttpRequests` block:

```java
.authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/**").authenticated()
        .anyRequest().denyAll()
)
```

And in `corsConfigurationSource()`, add POST and DELETE to allowed methods:

```java
config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
```

- [ ] **Step 7: Verify compilation**

Run: `cd backend && ./mvnw compile -q`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/com/payadmin/infra/controller/ backend/src/main/java/com/payadmin/config/SecurityConfig.java
git commit -m "feat: add REST controllers for infra module with RBAC"
```

---

## Task 7: Docker — PostgreSQL and Backend Config

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: Add PostgreSQL service and update backend**

Add to `docker-compose.yml`:

```yaml
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: payadmin_mgmt
      POSTGRES_USER: ${POSTGRES_USER:-payadmin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-payadmin}
    volumes:
      - pgdata:/var/lib/postgresql/data
    expose:
      - "5432"
```

Add to backend environment:

```yaml
      - MGMT_DATASOURCE_URL=jdbc:postgresql://postgres:5432/payadmin_mgmt
      - MGMT_DATASOURCE_USERNAME=${POSTGRES_USER:-payadmin}
      - MGMT_DATASOURCE_PASSWORD=${POSTGRES_PASSWORD:-payadmin}
      - WINRM_ENCRYPTION_KEY=${WINRM_ENCRYPTION_KEY:-docker-dev-key-min16}
```

Add backend `depends_on: postgres`.

Add at bottom:

```yaml
volumes:
  pgdata:
```

- [ ] **Step 2: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add PostgreSQL to docker-compose for management DB"
```

---

## Task 8: Frontend — Types, Hooks, and Sidebar

**Files:**
- Create: `frontend/src/lib/infra-types.ts`
- Create: `frontend/src/hooks/useCredentials.ts`
- Create: `frontend/src/hooks/useHosts.ts`
- Create: `frontend/src/hooks/useServiceGroups.ts`
- Create: `frontend/src/hooks/useMonitoring.ts`
- Create: `frontend/src/hooks/useAuditLog.ts`
- Modify: `frontend/src/components/AppSidebar.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create infra-types.ts**

```typescript
export interface CredentialDto {
  id: number
  name: string
  domain: string
  username: string
  hostCount: number
}

export interface HostDto {
  id: number
  hostname: string
  port: number
  useHttps: boolean
  credentialId: number
  credentialName: string
  description: string
  enabled: boolean
  lastSeen: string | null
  serviceCount: number
}

export interface ServiceGroupDto {
  id: number
  name: string
  description: string
  sortOrder: number
  serviceCount: number
}

export interface MonitoredServiceDto {
  id: number
  hostId: number
  hostname: string
  groupId: number
  groupName: string
  serviceName: string
  displayName: string
}

export interface MonitoringGroupDto {
  groupId: number
  groupName: string
  groupDescription: string
  services: MonitoringServiceDto[]
  runningCount: number
  stoppedCount: number
  unreachableCount: number
}

export interface MonitoringServiceDto {
  serviceId: number
  serviceName: string
  displayName: string
  hostId: number
  hostname: string
  status: string
  pid: number | null
  checkedAt: string | null
  errorMessage: string | null
}

export interface AuditLogDto {
  id: number
  timestamp: string
  username: string
  action: string
  hostname: string | null
  serviceName: string | null
  result: string
  errorDetail: string | null
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
```

- [ ] **Step 2: Create hooks (useCredentials, useHosts, useServiceGroups, useMonitoring, useAuditLog)**

Each hook follows the same pattern as existing `useMerchants.ts` — with AbortController for cleanup. Create all 5 hooks in `frontend/src/hooks/`. Each uses `apiFetch` from `@/lib/api` and the types from `@/lib/infra-types`.

`useCredentials.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import type { CredentialDto } from '@/lib/infra-types'

export function useCredentials() {
  const [data, setData] = useState<CredentialDto[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    apiFetch<CredentialDto[]>('/infra/credentials')
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { data, loading, refresh }
}
```

`useHosts.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import type { HostDto } from '@/lib/infra-types'

export function useHosts() {
  const [data, setData] = useState<HostDto[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    apiFetch<HostDto[]>('/infra/hosts')
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { data, loading, refresh }
}
```

`useServiceGroups.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import type { ServiceGroupDto } from '@/lib/infra-types'

export function useServiceGroups() {
  const [data, setData] = useState<ServiceGroupDto[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    apiFetch<ServiceGroupDto[]>('/infra/service-groups')
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { data, loading, refresh }
}
```

`useMonitoring.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import type { MonitoringGroupDto } from '@/lib/infra-types'

export function useMonitoring(pollInterval: number = 30000) {
  const [data, setData] = useState<MonitoringGroupDto[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    apiFetch<MonitoringGroupDto[]>('/infra/monitoring')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, pollInterval)
    return () => clearInterval(timer)
  }, [refresh, pollInterval])

  return { data, loading, refresh }
}

export async function executeServiceAction(serviceId: number, action: string): Promise<string> {
  const res = await apiFetch<{ result: string }>('/infra/monitoring/action', {
    method: 'POST',
    body: JSON.stringify({ serviceId, action }),
  })
  return res.result
}
```

`useAuditLog.ts`:
```typescript
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import type { AuditLogDto, PageResponse } from '@/lib/infra-types'

export function useAuditLog(page: number, username?: string, action?: string) {
  const [data, setData] = useState<PageResponse<AuditLogDto> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)

    const params = new URLSearchParams({ page: String(page), size: '20', sort: 'timestamp,desc' })
    if (username) params.set('username', username)
    if (action) params.set('action', action)

    apiFetch<PageResponse<AuditLogDto>>(`/infra/audit?${params}`, { signal: controller.signal })
      .then(setData)
      .catch((e) => { if (e.name !== 'AbortError') console.error(e) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })

    return () => controller.abort()
  }, [page, username, action])

  return { data, loading }
}
```

- [ ] **Step 3: Update AppSidebar — add Infrastructure section**

Add to the navItems array, after the existing items, a section divider and infra items. Add `Server`, `Activity`, `ClipboardList` imports from lucide-react. Show Infrastructure section only if user roles include `WINRM_ADMIN`.

The sidebar should show:
- Existing items (Merchants, Transactions, Settings)
- Divider label "Infrastructure" (only if WINRM_ADMIN)
- Hosts (`/infra/hosts`, Server icon)
- Monitoring (`/infra/monitoring`, Activity icon)
- Audit Log (`/infra/audit`, ClipboardList icon)

- [ ] **Step 4: Update App.tsx — add routes**

Add imports for HostsPage, MonitoringPage, AuditLogPage and routes inside the AppLayout:

```typescript
<Route path="/infra/hosts" element={<HostsPage />} />
<Route path="/infra/monitoring" element={<MonitoringPage />} />
<Route path="/infra/audit" element={<AuditLogPage />} />
```

- [ ] **Step 5: TypeScript check**

Run: `cd frontend && npx tsc -b --noEmit`
Expected: No errors (pages don't exist yet, but routes and hooks compile)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/infra-types.ts frontend/src/hooks/ frontend/src/components/AppSidebar.tsx frontend/src/App.tsx
git commit -m "feat: add infra types, hooks, sidebar nav, and routes"
```

---

## Task 9: Frontend — Hosts Page (3 Tabs)

**Files:**
- Create: `frontend/src/pages/HostsPage.tsx`
- Create: `frontend/src/components/HostsServersTab.tsx`
- Create: `frontend/src/components/HostsCredentialsTab.tsx`
- Create: `frontend/src/components/HostsServiceGroupsTab.tsx`
- Create: `frontend/src/components/StatusBadge.tsx`

- [ ] **Step 1: Create StatusBadge component**

Reusable status badge (Running=green, Stopped=red, Unknown=yellow, Online=green, Offline=red):

```typescript
import { cn } from '@/lib/utils'

const styles: Record<string, string> = {
  Running: 'bg-green-50 text-green-600',
  Online: 'bg-green-50 text-green-600',
  Stopped: 'bg-red-50 text-red-600',
  Offline: 'bg-red-50 text-red-600',
  Unknown: 'bg-amber-50 text-amber-600',
}

export default function StatusBadge({ status }: { status: string }) {
  const style = styles[status] || 'bg-slate-100 text-slate-600'
  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', style)}>
      {status === 'Running' || status === 'Online' ? '●' : status === 'Stopped' || status === 'Offline' ? '●' : '⚠'} {status}
    </span>
  )
}
```

- [ ] **Step 2: Create HostsPage with tabs**

Page with 3 tabs (Servers, Credentials, Service Groups) using local state. Each tab renders its respective component. Include "+ Add" buttons that open dialogs.

- [ ] **Step 3: Create HostsServersTab**

Table showing hosts with hostname, port, credential badge, service count, status, edit/delete buttons. Add Server dialog with form (hostname, port, HTTPS toggle, credential dropdown, description).

- [ ] **Step 4: Create HostsCredentialsTab**

Table showing credentials (name, domain\username, host count, actions). Add Credential dialog with form (name, domain, username, password). Delete blocked if used by hosts.

- [ ] **Step 5: Create HostsServiceGroupsTab**

Table showing service groups (name, description, service count, sort order, actions). Add/Delete with confirmation.

- [ ] **Step 6: TypeScript check and build**

Run: `cd frontend && npx tsc -b --noEmit && npm run build`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/HostsPage.tsx frontend/src/components/Hosts*.tsx frontend/src/components/StatusBadge.tsx
git commit -m "feat: add Hosts page with Servers, Credentials, Service Groups tabs"
```

---

## Task 10: Frontend — Monitoring Page

**Files:**
- Create: `frontend/src/pages/MonitoringPage.tsx`
- Create: `frontend/src/components/MonitoringGroup.tsx`
- Create: `frontend/src/components/ActionBadge.tsx`

- [ ] **Step 1: Create ActionBadge**

Color-coded badge for actions (START=green, STOP=red, RESTART=amber, HOST_ADD/CRED_ADD=blue):

```typescript
import { cn } from '@/lib/utils'

const styles: Record<string, string> = {
  START: 'bg-green-50 text-green-700',
  STOP: 'bg-red-50 text-red-700',
  RESTART: 'bg-amber-50 text-amber-700',
  HOST_ADD: 'bg-blue-50 text-blue-700',
  HOST_DELETE: 'bg-blue-50 text-blue-700',
  CRED_ADD: 'bg-blue-50 text-blue-700',
  CRED_DELETE: 'bg-blue-50 text-blue-700',
  SERVICE_ADD: 'bg-blue-50 text-blue-700',
  SERVICE_DELETE: 'bg-blue-50 text-blue-700',
}

export default function ActionBadge({ action }: { action: string }) {
  const style = styles[action] || 'bg-slate-100 text-slate-600'
  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', style)}>
      {action}
    </span>
  )
}
```

- [ ] **Step 2: Create MonitoringGroup**

Collapsible group component: header with group badge, description, summary counts (running/stopped/unreachable). Table inside with service rows (host, service name, status, info, Start/Stop/Restart buttons). Auto-expanded if any service is not Running.

- [ ] **Step 3: Create MonitoringPage**

Summary cards (Total/Running/Stopped/Unreachable), filter dropdowns, list of MonitoringGroup components. Auto-refresh via `useMonitoring(30000)`. "Last poll" timestamp display. Confirmation dialog before Stop/Restart actions.

- [ ] **Step 4: TypeScript check and build**

Run: `cd frontend && npx tsc -b --noEmit && npm run build`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/MonitoringPage.tsx frontend/src/components/MonitoringGroup.tsx frontend/src/components/ActionBadge.tsx
git commit -m "feat: add Monitoring page with collapsible groups and service control"
```

---

## Task 11: Frontend — Audit Log Page

**Files:**
- Create: `frontend/src/pages/AuditLogPage.tsx`

- [ ] **Step 1: Create AuditLogPage**

Table with timestamp, user, action (ActionBadge), host, service, result (StatusBadge-like). Filter dropdowns (date range, user, action). Pagination using existing Button/Table components. Failed rows highlighted red.

- [ ] **Step 2: TypeScript check and build**

Run: `cd frontend && npx tsc -b --noEmit && npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/AuditLogPage.tsx
git commit -m "feat: add Audit Log page with filters and pagination"
```

---

## Task 12: Integration Test and Final Verification

- [ ] **Step 1: Run all backend tests**

Run: `cd backend && ./mvnw test -q`
Expected: All tests PASS

- [ ] **Step 2: Run frontend build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Docker compose build**

Run: `docker compose build`
Expected: Both services build successfully

- [ ] **Step 4: Commit any remaining fixes**

```bash
git add -A && git commit -m "fix: integration fixes for WinRM module"
```
