# PayAdmin — Merchant List & Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a read-only admin panel for a payment gateway — login via Keycloak and a merchant list with detail view.

**Architecture:** Two services: Spring Boot 3.x REST API (OAuth2 Resource Server, JPA over Oracle) + React 18 SPA (Vite, Tailwind, shadcn/ui) served by nginx. Keycloak handles authentication via Direct Access Grant; Spring validates JWTs.

**Tech Stack:** Java 17, Spring Boot 3.x, Spring Security OAuth2 Resource Server, Spring Data JPA, Oracle (ojdbc11), React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-04-07-payadmin-merchant-list-design.md`

---

## File Structure

### Backend (`backend/`)

```
backend/
├── build.gradle                          # Gradle build with Spring Boot, JPA, OAuth2, Oracle
├── settings.gradle                       # Project name
├── src/main/java/com/payadmin/
│   ├── PayadminApplication.java          # Spring Boot entry point
│   ├── config/
│   │   └── SecurityConfig.java           # OAuth2 Resource Server + CORS
│   ├── controller/
│   │   └── MerchantController.java       # REST endpoints for merchants
│   ├── dto/
│   │   ├── MerchantListDto.java          # List projection (no logins)
│   │   ├── MerchantDetailDto.java        # Detail projection (with logins)
│   │   └── MerchantConfigDto.java        # Config parameter DTO
│   ├── entity/
│   │   ├── Merchant.java                 # JPA entity → AP#MERCHANTS
│   │   └── MercConfig.java              # JPA entity → MERC_CONFIG
│   ├── repository/
│   │   ├── MerchantRepository.java       # JPA repo with search query
│   │   └── MercConfigRepository.java     # JPA repo with active-only query
│   └── service/
│       └── MerchantService.java          # Business logic layer
├── src/main/resources/
│   └── application.yml                   # Datasource, JWT issuer, server config
├── src/test/java/com/payadmin/
│   ├── controller/
│   │   └── MerchantControllerTest.java   # WebMvcTest with mocked JWT
│   └── service/
│       └── MerchantServiceTest.java      # Unit tests with mocked repos
├── Dockerfile                            # Multi-stage: gradle build → JRE runtime
```

### Frontend (`frontend/`)

```
frontend/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts                    # Tailwind configuration
├── index.html                            # Vite entry HTML
├── components.json                       # shadcn/ui config
├── src/
│   ├── main.tsx                          # React entry point
│   ├── App.tsx                           # Router setup
│   ├── lib/
│   │   ├── utils.ts                      # shadcn cn() helper
│   │   ├── auth.ts                       # Keycloak token management
│   │   └── api.ts                        # Fetch wrapper with auth headers
│   ├── components/
│   │   ├── ui/                           # shadcn/ui generated components
│   │   ├── AppLayout.tsx                 # Sidebar + content layout
│   │   ├── AppSidebar.tsx                # Collapsible icon sidebar
│   │   ├── CircuitBadge.tsx              # Color-coded VISA/MC/MIR badge
│   │   ├── MerchantTable.tsx             # Table with columns
│   │   ├── MerchantDetailModal.tsx       # Dialog with info + config
│   │   └── SearchInput.tsx              # Debounced search field
│   ├── pages/
│   │   ├── LoginPage.tsx                 # Login form
│   │   └── MerchantsPage.tsx             # List + modal orchestration
│   └── hooks/
│       └── useMerchants.ts               # Data fetching hook
├── nginx.conf                            # Serve SPA + proxy /api
├── Dockerfile                            # Multi-stage: node build → nginx
```

### Root

```
docker-compose.yml                        # frontend + backend services
.gitignore
```

---

## Task 1: Backend Project Scaffold

**Files:**
- Create: `backend/build.gradle`
- Create: `backend/settings.gradle`
- Create: `backend/src/main/java/com/payadmin/PayadminApplication.java`
- Create: `backend/src/main/resources/application.yml`
- Create: `.gitignore`

- [ ] **Step 1: Create `.gitignore`**

```gitignore
# Java
backend/build/
backend/.gradle/
*.class
*.jar

# Frontend
frontend/node_modules/
frontend/dist/

# IDE
.idea/
*.iml
.vscode/

# OS
.DS_Store
Thumbs.db

# Superpowers
.superpowers/
```

- [ ] **Step 2: Create `backend/settings.gradle`**

```groovy
rootProject.name = 'payadmin'
```

- [ ] **Step 3: Create `backend/build.gradle`**

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.4.4'
    id 'io.spring.dependency-management' version '1.1.7'
}

group = 'com.payadmin'
version = '0.0.1'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
    implementation 'org.springframework.boot:spring-boot-starter-validation'

    runtimeOnly 'com.oracle.database.jdbc:ojdbc11:23.7.0.25.01'

    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

- [ ] **Step 4: Create `backend/src/main/java/com/payadmin/PayadminApplication.java`**

```java
package com.payadmin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PayadminApplication {

    public static void main(String[] args) {
        SpringApplication.run(PayadminApplication.class, args);
    }
}
```

- [ ] **Step 5: Create `backend/src/main/resources/application.yml`**

```yaml
server:
  port: 8080

spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:oracle:thin:@//localhost:1521/XEPDB1}
    username: ${SPRING_DATASOURCE_USERNAME:payadmin}
    password: ${SPRING_DATASOURCE_PASSWORD:payadmin}
    driver-class-name: oracle.jdbc.OracleDriver
  jpa:
    hibernate:
      ddl-auto: none
    database-platform: org.hibernate.dialect.OracleDialect
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI:http://localhost:8180/realms/payadmin}
```

- [ ] **Step 6: Verify project compiles**

Run: `cd backend && ./gradlew build -x test`

If `gradlew` doesn't exist, generate wrapper first:

Run: `cd backend && gradle wrapper --gradle-version 8.13`

Expected: BUILD SUCCESSFUL

- [ ] **Step 7: Commit**

```bash
git add .gitignore backend/build.gradle backend/settings.gradle \
  backend/src/main/java/com/payadmin/PayadminApplication.java \
  backend/src/main/resources/application.yml \
  backend/gradle backend/gradlew backend/gradlew.bat
git commit -m "feat: scaffold Spring Boot backend project"
```

---

## Task 2: JPA Entities

**Files:**
- Create: `backend/src/main/java/com/payadmin/entity/Merchant.java`
- Create: `backend/src/main/java/com/payadmin/entity/MercConfig.java`

- [ ] **Step 1: Create `Merchant.java`**

The table name `AP#MERCHANTS` contains a `#` which requires quoting.

```java
package com.payadmin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "\"AP#MERCHANTS\"")
public class Merchant {

    @Id
    @Column(name = "MERCID")
    private Integer mercid;

    @Column(name = "NAME", nullable = false)
    private String name;

    @Column(name = "HIERARCHYID")
    private Integer hierarchyId;

    @Column(name = "PALOGIN")
    private String paLogin;

    @Column(name = "PAPASSWORD")
    private String paPassword;

    @Column(name = "APILOGIN")
    private String apiLogin;

    @Column(name = "APIPASSWORD")
    private String apiPassword;

    @Column(name = "INITIATOR", nullable = false)
    private String initiator;

    @Column(name = "CIRCUIT")
    private String circuit;

    public Integer getMercid() { return mercid; }
    public void setMercid(Integer mercid) { this.mercid = mercid; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getHierarchyId() { return hierarchyId; }
    public void setHierarchyId(Integer hierarchyId) { this.hierarchyId = hierarchyId; }

    public String getPaLogin() { return paLogin; }
    public void setPaLogin(String paLogin) { this.paLogin = paLogin; }

    public String getPaPassword() { return paPassword; }
    public void setPaPassword(String paPassword) { this.paPassword = paPassword; }

    public String getApiLogin() { return apiLogin; }
    public void setApiLogin(String apiLogin) { this.apiLogin = apiLogin; }

    public String getApiPassword() { return apiPassword; }
    public void setApiPassword(String apiPassword) { this.apiPassword = apiPassword; }

    public String getInitiator() { return initiator; }
    public void setInitiator(String initiator) { this.initiator = initiator; }

    public String getCircuit() { return circuit; }
    public void setCircuit(String circuit) { this.circuit = circuit; }
}
```

- [ ] **Step 2: Create `MercConfig.java`**

`MERC_CONFIG` has no single primary key column. Use a composite key with `@IdClass`.

```java
package com.payadmin.entity;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

public class MercConfigId implements Serializable {
    private Integer mercid;
    private String parameterName;
    private LocalDate dateBegin;

    public MercConfigId() {}

    public MercConfigId(Integer mercid, String parameterName, LocalDate dateBegin) {
        this.mercid = mercid;
        this.parameterName = parameterName;
        this.dateBegin = dateBegin;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MercConfigId that)) return false;
        return Objects.equals(mercid, that.mercid)
                && Objects.equals(parameterName, that.parameterName)
                && Objects.equals(dateBegin, that.dateBegin);
    }

    @Override
    public int hashCode() {
        return Objects.hash(mercid, parameterName, dateBegin);
    }
}
```

Put `MercConfigId` in the same file or as a separate file. For clarity, put it in the entity package as a separate file:

Create: `backend/src/main/java/com/payadmin/entity/MercConfigId.java` (code above)

Now create the entity:

```java
package com.payadmin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "MERC_CONFIG")
@IdClass(MercConfigId.class)
public class MercConfig {

    @Id
    @Column(name = "MERCID")
    private Integer mercid;

    @Id
    @Column(name = "PARAMETERNAME", nullable = false)
    private String parameterName;

    @Column(name = "PARAMETERVALUE", nullable = false)
    private String parameterValue;

    @Id
    @Column(name = "DATEBEGIN")
    private LocalDate dateBegin;

    @Column(name = "DATEEND")
    private LocalDate dateEnd;

    public Integer getMercid() { return mercid; }
    public void setMercid(Integer mercid) { this.mercid = mercid; }

    public String getParameterName() { return parameterName; }
    public void setParameterName(String parameterName) { this.parameterName = parameterName; }

    public String getParameterValue() { return parameterValue; }
    public void setParameterValue(String parameterValue) { this.parameterValue = parameterValue; }

    public LocalDate getDateBegin() { return dateBegin; }
    public void setDateBegin(LocalDate dateBegin) { this.dateBegin = dateBegin; }

    public LocalDate getDateEnd() { return dateEnd; }
    public void setDateEnd(LocalDate dateEnd) { this.dateEnd = dateEnd; }
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd backend && ./gradlew compileJava`

Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/payadmin/entity/
git commit -m "feat: add JPA entities for AP#MERCHANTS and MERC_CONFIG"
```

---

## Task 3: DTOs

**Files:**
- Create: `backend/src/main/java/com/payadmin/dto/MerchantListDto.java`
- Create: `backend/src/main/java/com/payadmin/dto/MerchantDetailDto.java`
- Create: `backend/src/main/java/com/payadmin/dto/MerchantConfigDto.java`

- [ ] **Step 1: Create `MerchantListDto.java`**

```java
package com.payadmin.dto;

public record MerchantListDto(
        Integer mercid,
        String name,
        String initiator,
        String circuit,
        Integer hierarchyId
) {}
```

- [ ] **Step 2: Create `MerchantDetailDto.java`**

```java
package com.payadmin.dto;

public record MerchantDetailDto(
        Integer mercid,
        String name,
        String initiator,
        String circuit,
        Integer hierarchyId,
        String paLogin,
        String apiLogin
) {}
```

- [ ] **Step 3: Create `MerchantConfigDto.java`**

```java
package com.payadmin.dto;

import java.time.LocalDate;

public record MerchantConfigDto(
        String parameterName,
        String parameterValue,
        LocalDate dateBegin,
        LocalDate dateEnd
) {}
```

- [ ] **Step 4: Verify compilation**

Run: `cd backend && ./gradlew compileJava`

Expected: BUILD SUCCESSFUL

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/payadmin/dto/
git commit -m "feat: add merchant DTOs (list, detail, config)"
```

---

## Task 4: Repositories

**Files:**
- Create: `backend/src/main/java/com/payadmin/repository/MerchantRepository.java`
- Create: `backend/src/main/java/com/payadmin/repository/MercConfigRepository.java`

- [ ] **Step 1: Create `MerchantRepository.java`**

```java
package com.payadmin.repository;

import com.payadmin.entity.Merchant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MerchantRepository extends JpaRepository<Merchant, Integer> {

    @Query("""
            SELECT m FROM Merchant m
            WHERE (:search IS NULL
                OR UPPER(m.name) LIKE UPPER(CONCAT('%', :search, '%'))
                OR CAST(m.mercid AS string) = :search)
            """)
    Page<Merchant> findBySearch(@Param("search") String search, Pageable pageable);
}
```

- [ ] **Step 2: Create `MercConfigRepository.java`**

```java
package com.payadmin.repository;

import com.payadmin.entity.MercConfig;
import com.payadmin.entity.MercConfigId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MercConfigRepository extends JpaRepository<MercConfig, MercConfigId> {

    @Query("""
            SELECT mc FROM MercConfig mc
            WHERE mc.mercid = :mercid
              AND mc.dateBegin <= CURRENT_DATE
              AND mc.dateEnd > CURRENT_DATE
            ORDER BY mc.parameterName
            """)
    List<MercConfig> findActiveByMercid(@Param("mercid") Integer mercid);
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd backend && ./gradlew compileJava`

Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/payadmin/repository/
git commit -m "feat: add merchant and config JPA repositories"
```

---

## Task 5: Service Layer

**Files:**
- Create: `backend/src/main/java/com/payadmin/service/MerchantService.java`
- Create: `backend/src/test/java/com/payadmin/service/MerchantServiceTest.java`

- [ ] **Step 1: Write failing tests for `MerchantService`**

```java
package com.payadmin.service;

import com.payadmin.dto.MerchantConfigDto;
import com.payadmin.dto.MerchantDetailDto;
import com.payadmin.dto.MerchantListDto;
import com.payadmin.entity.MercConfig;
import com.payadmin.entity.Merchant;
import com.payadmin.repository.MercConfigRepository;
import com.payadmin.repository.MerchantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MerchantServiceTest {

    @Mock
    private MerchantRepository merchantRepository;

    @Mock
    private MercConfigRepository mercConfigRepository;

    @InjectMocks
    private MerchantService merchantService;

    private Merchant sampleMerchant;

    @BeforeEach
    void setUp() {
        sampleMerchant = new Merchant();
        sampleMerchant.setMercid(1001);
        sampleMerchant.setName("OOO Romashka");
        sampleMerchant.setInitiator("system");
        sampleMerchant.setCircuit("VISA");
        sampleMerchant.setHierarchyId(10);
        sampleMerchant.setPaLogin("merchant01");
        sampleMerchant.setApiLogin("api_romashka");
        sampleMerchant.setPaPassword("secret");
        sampleMerchant.setApiPassword("secret2");
    }

    @Test
    void list_returnsMerchantListDtos() {
        Page<Merchant> page = new PageImpl<>(List.of(sampleMerchant));
        when(merchantRepository.findBySearch(eq(null), any(Pageable.class))).thenReturn(page);

        Page<MerchantListDto> result = merchantService.list(null, PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
        MerchantListDto dto = result.getContent().get(0);
        assertThat(dto.mercid()).isEqualTo(1001);
        assertThat(dto.name()).isEqualTo("OOO Romashka");
        assertThat(dto.initiator()).isEqualTo("system");
        assertThat(dto.circuit()).isEqualTo("VISA");
        assertThat(dto.hierarchyId()).isEqualTo(10);
    }

    @Test
    void list_withSearch_passesSearchToRepo() {
        Page<Merchant> page = new PageImpl<>(List.of(sampleMerchant));
        when(merchantRepository.findBySearch(eq("romashka"), any(Pageable.class))).thenReturn(page);

        Page<MerchantListDto> result = merchantService.list("romashka", PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getById_returnsMerchantDetailDto_withoutPasswords() {
        when(merchantRepository.findById(1001)).thenReturn(Optional.of(sampleMerchant));

        MerchantDetailDto dto = merchantService.getById(1001);

        assertThat(dto.mercid()).isEqualTo(1001);
        assertThat(dto.paLogin()).isEqualTo("merchant01");
        assertThat(dto.apiLogin()).isEqualTo("api_romashka");
    }

    @Test
    void getById_notFound_throwsException() {
        when(merchantRepository.findById(9999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> merchantService.getById(9999))
                .isInstanceOf(MerchantNotFoundException.class);
    }

    @Test
    void getConfig_returnsActiveConfigs() {
        MercConfig config = new MercConfig();
        config.setMercid(1001);
        config.setParameterName("CURRENCY");
        config.setParameterValue("RUB");
        config.setDateBegin(LocalDate.of(2024, 1, 1));
        config.setDateEnd(LocalDate.of(2050, 1, 1));

        when(merchantRepository.findById(1001)).thenReturn(Optional.of(sampleMerchant));
        when(mercConfigRepository.findActiveByMercid(1001)).thenReturn(List.of(config));

        List<MerchantConfigDto> result = merchantService.getConfig(1001);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).parameterName()).isEqualTo("CURRENCY");
        assertThat(result.get(0).parameterValue()).isEqualTo("RUB");
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && ./gradlew test`

Expected: FAIL — `MerchantService` and `MerchantNotFoundException` do not exist yet.

- [ ] **Step 3: Create `MerchantNotFoundException.java`**

Create: `backend/src/main/java/com/payadmin/service/MerchantNotFoundException.java`

```java
package com.payadmin.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class MerchantNotFoundException extends RuntimeException {

    public MerchantNotFoundException(Integer mercid) {
        super("Merchant not found: " + mercid);
    }
}
```

- [ ] **Step 4: Create `MerchantService.java`**

```java
package com.payadmin.service;

import com.payadmin.dto.MerchantConfigDto;
import com.payadmin.dto.MerchantDetailDto;
import com.payadmin.dto.MerchantListDto;
import com.payadmin.entity.Merchant;
import com.payadmin.repository.MercConfigRepository;
import com.payadmin.repository.MerchantRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class MerchantService {

    private final MerchantRepository merchantRepository;
    private final MercConfigRepository mercConfigRepository;

    public MerchantService(MerchantRepository merchantRepository,
                           MercConfigRepository mercConfigRepository) {
        this.merchantRepository = merchantRepository;
        this.mercConfigRepository = mercConfigRepository;
    }

    public Page<MerchantListDto> list(String search, Pageable pageable) {
        return merchantRepository.findBySearch(search, pageable)
                .map(m -> new MerchantListDto(
                        m.getMercid(),
                        m.getName(),
                        m.getInitiator(),
                        m.getCircuit(),
                        m.getHierarchyId()
                ));
    }

    public MerchantDetailDto getById(Integer mercid) {
        Merchant m = merchantRepository.findById(mercid)
                .orElseThrow(() -> new MerchantNotFoundException(mercid));
        return new MerchantDetailDto(
                m.getMercid(),
                m.getName(),
                m.getInitiator(),
                m.getCircuit(),
                m.getHierarchyId(),
                m.getPaLogin(),
                m.getApiLogin()
        );
    }

    public List<MerchantConfigDto> getConfig(Integer mercid) {
        merchantRepository.findById(mercid)
                .orElseThrow(() -> new MerchantNotFoundException(mercid));
        return mercConfigRepository.findActiveByMercid(mercid).stream()
                .map(mc -> new MerchantConfigDto(
                        mc.getParameterName(),
                        mc.getParameterValue(),
                        mc.getDateBegin(),
                        mc.getDateEnd()
                ))
                .toList();
    }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && ./gradlew test`

Expected: All 5 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/payadmin/service/ \
  backend/src/test/java/com/payadmin/service/
git commit -m "feat: add MerchantService with unit tests"
```

---

## Task 6: Security Configuration

**Files:**
- Create: `backend/src/main/java/com/payadmin/config/SecurityConfig.java`

- [ ] **Step 1: Create `SecurityConfig.java`**

```java
package com.payadmin.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                );
        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        grantedAuthoritiesConverter.setAuthoritiesClaimName("realm_access.roles");
        grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        return converter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:80", "http://localhost"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd backend && ./gradlew compileJava`

Expected: BUILD SUCCESSFUL

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/payadmin/config/SecurityConfig.java
git commit -m "feat: add Spring Security config with OAuth2 Resource Server"
```

---

## Task 7: REST Controller

**Files:**
- Create: `backend/src/main/java/com/payadmin/controller/MerchantController.java`
- Create: `backend/src/test/java/com/payadmin/controller/MerchantControllerTest.java`

- [ ] **Step 1: Write failing controller tests**

```java
package com.payadmin.controller;

import com.payadmin.dto.MerchantConfigDto;
import com.payadmin.dto.MerchantDetailDto;
import com.payadmin.dto.MerchantListDto;
import com.payadmin.service.MerchantNotFoundException;
import com.payadmin.service.MerchantService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.bean.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MerchantController.class)
class MerchantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MerchantService merchantService;

    @Test
    void listMerchants_returns200WithPage() throws Exception {
        var dto = new MerchantListDto(1001, "OOO Romashka", "system", "VISA", 10);
        var page = new PageImpl<>(List.of(dto), PageRequest.of(0, 20), 1);
        when(merchantService.list(eq(null), any())).thenReturn(page);

        mockMvc.perform(get("/api/merchants")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].mercid").value(1001))
                .andExpect(jsonPath("$.content[0].name").value("OOO Romashka"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void listMerchants_withSearch_passesParam() throws Exception {
        var dto = new MerchantListDto(1001, "OOO Romashka", "system", "VISA", 10);
        var page = new PageImpl<>(List.of(dto), PageRequest.of(0, 20), 1);
        when(merchantService.list(eq("romashka"), any())).thenReturn(page);

        mockMvc.perform(get("/api/merchants?search=romashka")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].mercid").value(1001));
    }

    @Test
    void getMerchant_returns200WithDetail() throws Exception {
        var dto = new MerchantDetailDto(1001, "OOO Romashka", "system", "VISA", 10, "merchant01", "api_rom");
        when(merchantService.getById(1001)).thenReturn(dto);

        mockMvc.perform(get("/api/merchants/1001")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mercid").value(1001))
                .andExpect(jsonPath("$.paLogin").value("merchant01"));
    }

    @Test
    void getMerchant_notFound_returns404() throws Exception {
        when(merchantService.getById(9999)).thenThrow(new MerchantNotFoundException(9999));

        mockMvc.perform(get("/api/merchants/9999")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()))
                .andExpect(status().isNotFound());
    }

    @Test
    void getConfig_returns200WithList() throws Exception {
        var dto = new MerchantConfigDto("CURRENCY", "RUB",
                LocalDate.of(2024, 1, 1), LocalDate.of(2050, 1, 1));
        when(merchantService.getConfig(1001)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/merchants/1001/config")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].parameterName").value("CURRENCY"))
                .andExpect(jsonPath("$[0].parameterValue").value("RUB"));
    }

    @Test
    void listMerchants_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/merchants"))
                .andExpect(status().isUnauthorized());
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && ./gradlew test`

Expected: FAIL — `MerchantController` does not exist.

- [ ] **Step 3: Create `MerchantController.java`**

```java
package com.payadmin.controller;

import com.payadmin.dto.MerchantConfigDto;
import com.payadmin.dto.MerchantDetailDto;
import com.payadmin.dto.MerchantListDto;
import com.payadmin.service.MerchantService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/merchants")
public class MerchantController {

    private final MerchantService merchantService;

    public MerchantController(MerchantService merchantService) {
        this.merchantService = merchantService;
    }

    @GetMapping
    public Page<MerchantListDto> list(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return merchantService.list(search, pageable);
    }

    @GetMapping("/{id}")
    public MerchantDetailDto getById(@PathVariable("id") Integer id) {
        return merchantService.getById(id);
    }

    @GetMapping("/{id}/config")
    public List<MerchantConfigDto> getConfig(@PathVariable("id") Integer id) {
        return merchantService.getConfig(id);
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && ./gradlew test`

Expected: All 11 tests PASS (5 service + 6 controller)

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/payadmin/controller/ \
  backend/src/test/java/com/payadmin/controller/
git commit -m "feat: add MerchantController with REST endpoints and tests"
```

---

## Task 8: Backend Dockerfile

**Files:**
- Create: `backend/Dockerfile`

- [ ] **Step 1: Create `backend/Dockerfile`**

```dockerfile
FROM gradle:8.13-jdk17 AS build
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
RUN gradle dependencies --no-daemon || true
COPY src ./src
RUN gradle bootJar --no-daemon

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

- [ ] **Step 2: Commit**

```bash
git add backend/Dockerfile
git commit -m "feat: add backend Dockerfile (multi-stage build)"
```

---

## Task 9: Frontend Project Scaffold

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.app.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/globals.css`
- Create: `frontend/src/lib/utils.ts`
- Create: `frontend/components.json`
- Create: `frontend/postcss.config.js`

- [ ] **Step 1: Scaffold React + Vite project**

Run:

```bash
cd /mnt/c/work/payadmin
npm create vite@latest frontend -- --template react-ts
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
cd /mnt/c/work/payadmin/frontend
npm install
npm install -D tailwindcss @tailwindcss/vite
npm install react-router-dom
npm install class-variance-authority clsx tailwind-merge lucide-react
```

- [ ] **Step 3: Configure Tailwind**

Replace `frontend/src/index.css` (or `globals.css`) content with:

```css
@import "tailwindcss";
```

Update `frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
```

Update `frontend/tsconfig.app.json` — add paths:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

(Merge into existing compilerOptions in the file generated by Vite.)

- [ ] **Step 4: Create shadcn/ui utils**

Create `frontend/src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 5: Initialize shadcn/ui**

Run:

```bash
cd /mnt/c/work/payadmin/frontend
npx shadcn@latest init -d
```

Then add required components:

```bash
npx shadcn@latest add button input table dialog
```

- [ ] **Step 6: Verify dev server starts**

Run: `cd /mnt/c/work/payadmin/frontend && npm run dev`

Open `http://localhost:5173` — should show Vite default page.

Kill the server (`Ctrl+C`).

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold React frontend with Vite, Tailwind, shadcn/ui"
```

---

## Task 10: Auth Module (Keycloak)

**Files:**
- Create: `frontend/src/lib/auth.ts`
- Create: `frontend/src/lib/api.ts`

- [ ] **Step 1: Create `frontend/src/lib/auth.ts`**

```typescript
interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
}

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180'
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'payadmin'
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'payadmin-frontend'

const TOKEN_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`

const state: AuthState = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
}

export async function login(username: string, password: string): Promise<void> {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: KEYCLOAK_CLIENT_ID,
    username,
    password,
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    throw new Error('Invalid credentials')
  }

  const data: TokenResponse = await res.json()
  setTokens(data)
}

export function logout(): void {
  state.accessToken = null
  state.refreshToken = null
  state.expiresAt = null
}

export function getAccessToken(): string | null {
  return state.accessToken
}

export function isAuthenticated(): boolean {
  return state.accessToken !== null && state.expiresAt !== null && Date.now() < state.expiresAt
}

export async function refreshAccessToken(): Promise<boolean> {
  if (!state.refreshToken) return false

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: KEYCLOAK_CLIENT_ID,
    refresh_token: state.refreshToken,
  })

  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!res.ok) return false

    const data: TokenResponse = await res.json()
    setTokens(data)
    return true
  } catch {
    return false
  }
}

export function getUserInfo(): { username: string; roles: string[] } | null {
  if (!state.accessToken) return null
  try {
    const payload = JSON.parse(atob(state.accessToken.split('.')[1]))
    return {
      username: payload.preferred_username || payload.sub,
      roles: payload.realm_access?.roles || [],
    }
  } catch {
    return null
  }
}

function setTokens(data: TokenResponse): void {
  state.accessToken = data.access_token
  state.refreshToken = data.refresh_token
  state.expiresAt = Date.now() + data.expires_in * 1000
}
```

- [ ] **Step 2: Create `frontend/src/lib/api.ts`**

```typescript
import { getAccessToken, refreshAccessToken, isAuthenticated, logout } from './auth'

const BASE_URL = '/api'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isAuthenticated()) {
    const refreshed = await refreshAccessToken()
    if (!refreshed) {
      logout()
      window.location.href = '/login'
      throw new Error('Session expired')
    }
  }

  const token = getAccessToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })

  if (res.status === 401) {
    logout()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }

  return res.json()
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd /mnt/c/work/payadmin/frontend && npx tsc --noEmit`

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/auth.ts frontend/src/lib/api.ts
git commit -m "feat: add Keycloak auth module and API fetch wrapper"
```

---

## Task 11: Login Page

**Files:**
- Create: `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: Create `LoginPage.tsx`**

```tsx
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login } from '@/lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      navigate('/merchants')
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-[380px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="pt-8 pb-6 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl inline-flex items-center justify-center text-white text-lg font-bold mb-4">
            PA
          </div>
          <h1 className="text-xl font-semibold text-slate-800">PayAdmin</h1>
          <p className="text-slate-400 text-sm">Payment Gateway Administration</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-slate-600 text-sm font-medium mb-1.5">
              Username
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-slate-600 text-sm font-medium mb-1.5">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="px-8 py-3 bg-slate-50 border-t border-slate-200 text-center">
          <span className="text-slate-400 text-xs">Authenticated via corporate LDAP</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /mnt/c/work/payadmin/frontend && npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/LoginPage.tsx
git commit -m "feat: add login page with Keycloak authentication"
```

---

## Task 12: App Layout & Sidebar

**Files:**
- Create: `frontend/src/components/AppLayout.tsx`
- Create: `frontend/src/components/AppSidebar.tsx`

- [ ] **Step 1: Create `AppSidebar.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, CreditCard, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getUserInfo, logout } from '@/lib/auth'

const navItems = [
  { icon: Home, label: 'Merchants', path: '/merchants' },
  { icon: CreditCard, label: 'Transactions', path: '/transactions', disabled: true },
  { icon: Settings, label: 'Settings', path: '/settings', disabled: true },
]

export default function AppSidebar() {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user = getUserInfo()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const roleLabel = user?.roles.includes('ADMIN')
    ? 'ADMIN'
    : user?.roles.includes('OPERATOR')
      ? 'OPERATOR'
      : 'VIEWER'

  return (
    <div
      className={cn(
        'h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-200',
        expanded ? 'w-52' : 'w-[52px]'
      )}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="p-2.5 mb-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
          PA
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 px-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => !item.disabled && navigate(item.path)}
              disabled={item.disabled}
              className={cn(
                'flex items-center gap-3 rounded-lg p-2 text-sm transition-colors',
                active
                  ? 'bg-blue-50 text-blue-600'
                  : item.disabled
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {expanded && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-2 border-t border-slate-200">
        <div className="flex items-center gap-2 p-2">
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 text-xs font-semibold shrink-0">
            {user?.username?.substring(0, 2).toUpperCase() || '??'}
          </div>
          {expanded && (
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-700 truncate">{user?.username}</div>
              <div className="text-xs text-slate-400">{roleLabel}</div>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg p-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 w-full transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {expanded && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `AppLayout.tsx`**

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { isAuthenticated } from '@/lib/auth'
import AppSidebar from './AppSidebar'

export default function AppLayout() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd /mnt/c/work/payadmin/frontend && npx tsc --noEmit`

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/AppLayout.tsx frontend/src/components/AppSidebar.tsx
git commit -m "feat: add app layout with collapsible icon sidebar"
```

---

## Task 13: Merchant Data Fetching Hook

**Files:**
- Create: `frontend/src/hooks/useMerchants.ts`

- [ ] **Step 1: Create `useMerchants.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export interface MerchantListItem {
  mercid: number
  name: string
  initiator: string
  circuit: string
  hierarchyId: number
}

export interface MerchantDetail {
  mercid: number
  name: string
  initiator: string
  circuit: string
  hierarchyId: number
  paLogin: string
  apiLogin: string
}

export interface MerchantConfig {
  parameterName: string
  parameterValue: string
  dateBegin: string
  dateEnd: string
}

interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export function useMerchantList(search: string, page: number, size: number = 20) {
  const [data, setData] = useState<PageResponse<MerchantListItem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort: 'mercid,asc',
    })
    if (search) params.set('search', search)

    apiFetch<PageResponse<MerchantListItem>>(`/merchants?${params}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, page, size])

  return { data, loading, error }
}

export function useMerchantDetail(mercid: number | null) {
  const [detail, setDetail] = useState<MerchantDetail | null>(null)
  const [config, setConfig] = useState<MerchantConfig[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDetail = useCallback(async (id: number) => {
    setLoading(true)
    try {
      const [detailData, configData] = await Promise.all([
        apiFetch<MerchantDetail>(`/merchants/${id}`),
        apiFetch<MerchantConfig[]>(`/merchants/${id}/config`),
      ])
      setDetail(detailData)
      setConfig(configData)
    } catch {
      setDetail(null)
      setConfig([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (mercid !== null) {
      fetchDetail(mercid)
    } else {
      setDetail(null)
      setConfig([])
    }
  }, [mercid, fetchDetail])

  return { detail, config, loading }
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /mnt/c/work/payadmin/frontend && npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useMerchants.ts
git commit -m "feat: add merchant data fetching hooks"
```

---

## Task 14: Merchant Table & Supporting Components

**Files:**
- Create: `frontend/src/components/CircuitBadge.tsx`
- Create: `frontend/src/components/SearchInput.tsx`
- Create: `frontend/src/components/MerchantTable.tsx`

- [ ] **Step 1: Create `CircuitBadge.tsx`**

```tsx
import { cn } from '@/lib/utils'

const circuitStyles: Record<string, string> = {
  VISA: 'bg-blue-100 text-blue-700',
  MC: 'bg-amber-100 text-amber-800',
  MIR: 'bg-green-100 text-green-800',
}

export default function CircuitBadge({ circuit }: { circuit: string }) {
  const style = circuitStyles[circuit?.toUpperCase()] || 'bg-slate-100 text-slate-600'
  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', style)}>
      {circuit}
    </span>
  )
}
```

- [ ] **Step 2: Create `SearchInput.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => onChange(local), 300)
    return () => clearTimeout(timer)
  }, [local, onChange])

  useEffect(() => {
    setLocal(value)
  }, [value])

  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder || 'Search...'}
        className="pl-9"
      />
    </div>
  )
}
```

- [ ] **Step 3: Create `MerchantTable.tsx`**

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import CircuitBadge from './CircuitBadge'
import type { MerchantListItem } from '@/hooks/useMerchants'

interface MerchantTableProps {
  merchants: MerchantListItem[]
  totalElements: number
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onRowClick: (mercid: number) => void
}

export default function MerchantTable({
  merchants,
  totalElements,
  page,
  totalPages,
  onPageChange,
  onRowClick,
}: MerchantTableProps) {
  return (
    <div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-20 text-xs font-medium text-slate-500">MERC ID</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">NAME</TableHead>
              <TableHead className="w-28 text-xs font-medium text-slate-500">INITIATOR</TableHead>
              <TableHead className="w-24 text-xs font-medium text-slate-500">CIRCUIT</TableHead>
              <TableHead className="w-28 text-xs font-medium text-slate-500">HIERARCHY</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {merchants.map((m) => (
              <TableRow
                key={m.mercid}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => onRowClick(m.mercid)}
              >
                <TableCell className="text-blue-600 font-medium">{m.mercid}</TableCell>
                <TableCell className="text-slate-800">{m.name}</TableCell>
                <TableCell className="text-slate-500">{m.initiator}</TableCell>
                <TableCell>
                  <CircuitBadge circuit={m.circuit} />
                </TableCell>
                <TableCell className="text-slate-500">{m.hierarchyId}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-slate-400">
          Showing {page * 20 + 1}–{Math.min((page + 1) * 20, totalElements)} of{' '}
          {totalElements.toLocaleString()}
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = page < 3 ? i : page - 2 + i
            if (p >= totalPages) return null
            return (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(p)}
              >
                {p + 1}
              </Button>
            )
          })}
          {totalPages > 5 && page < totalPages - 3 && (
            <>
              <span className="px-2 text-slate-400 text-sm self-center">...</span>
              <Button variant="outline" size="sm" onClick={() => onPageChange(totalPages - 1)}>
                {totalPages}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify compilation**

Run: `cd /mnt/c/work/payadmin/frontend && npx tsc --noEmit`

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/CircuitBadge.tsx \
  frontend/src/components/SearchInput.tsx \
  frontend/src/components/MerchantTable.tsx
git commit -m "feat: add merchant table, circuit badge, and search input components"
```

---

## Task 15: Merchant Detail Modal

**Files:**
- Create: `frontend/src/components/MerchantDetailModal.tsx`

- [ ] **Step 1: Create `MerchantDetailModal.tsx`**

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import CircuitBadge from './CircuitBadge'
import type { MerchantDetail, MerchantConfig } from '@/hooks/useMerchants'

interface MerchantDetailModalProps {
  open: boolean
  onClose: () => void
  detail: MerchantDetail | null
  config: MerchantConfig[]
  loading: boolean
}

export default function MerchantDetailModal({
  open,
  onClose,
  detail,
  config,
  loading,
}: MerchantDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        {loading || !detail ? (
          <div className="flex items-center justify-center py-12 text-slate-400">Loading...</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-slate-800">
                {detail.name}
              </DialogTitle>
              <p className="text-sm text-slate-400">MERC ID: {detail.mercid}</p>
            </DialogHeader>

            {/* Merchant info grid */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <InfoField label="Circuit">
                <CircuitBadge circuit={detail.circuit} />
              </InfoField>
              <InfoField label="Hierarchy ID">{detail.hierarchyId}</InfoField>
              <InfoField label="Initiator">{detail.initiator}</InfoField>
              <InfoField label="PA Login">{detail.paLogin || '—'}</InfoField>
              <InfoField label="API Login">{detail.apiLogin || '—'}</InfoField>
            </div>

            {/* Config section */}
            <div className="border-t border-slate-200 mt-5 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-800">Configuration</h4>
                <span className="text-xs text-slate-400">Active only</span>
              </div>

              {config.length === 0 ? (
                <p className="text-sm text-slate-400">No active configuration</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {config.map((c) => (
                    <div
                      key={c.parameterName}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5"
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-xs font-medium text-slate-800">
                          {c.parameterName}
                        </span>
                        <span className="text-sm text-slate-600 font-medium">
                          {c.parameterValue}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {c.dateBegin} — {c.dateEnd}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-400 uppercase mb-1">{label}</div>
      <div className="text-sm text-slate-700">{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /mnt/c/work/payadmin/frontend && npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/MerchantDetailModal.tsx
git commit -m "feat: add merchant detail modal with config view"
```

---

## Task 16: Merchants Page & Router

**Files:**
- Create: `frontend/src/pages/MerchantsPage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Create `MerchantsPage.tsx`**

```tsx
import { useState, useCallback } from 'react'
import SearchInput from '@/components/SearchInput'
import MerchantTable from '@/components/MerchantTable'
import MerchantDetailModal from '@/components/MerchantDetailModal'
import { useMerchantList, useMerchantDetail } from '@/hooks/useMerchants'

export default function MerchantsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selectedMercid, setSelectedMercid] = useState<number | null>(null)

  const { data, loading, error } = useMerchantList(search, page)
  const { detail, config, loading: detailLoading } = useMerchantDetail(selectedMercid)

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(0)
  }, [])

  return (
    <div className="p-6">
      <div className="mb-1">
        <h1 className="text-xl font-semibold text-slate-800">Merchants</h1>
        <span className="text-sm text-slate-400">
          {data ? `${data.totalElements.toLocaleString()} total` : ''}
        </span>
      </div>

      <div className="my-4">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by ID or Name..."
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">Loading...</div>
      ) : data ? (
        <MerchantTable
          merchants={data.content}
          totalElements={data.totalElements}
          page={data.number}
          totalPages={data.totalPages}
          onPageChange={setPage}
          onRowClick={setSelectedMercid}
        />
      ) : null}

      <MerchantDetailModal
        open={selectedMercid !== null}
        onClose={() => setSelectedMercid(null)}
        detail={detail}
        config={config}
        loading={detailLoading}
      />
    </div>
  )
}
```

- [ ] **Step 2: Replace `App.tsx`**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import MerchantsPage from '@/pages/MerchantsPage'
import AppLayout from '@/components/AppLayout'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/merchants" element={<MerchantsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/merchants" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Update `main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 4: Verify compilation and dev server**

Run: `cd /mnt/c/work/payadmin/frontend && npx tsc --noEmit`

Expected: No errors

Run: `cd /mnt/c/work/payadmin/frontend && npm run build`

Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/MerchantsPage.tsx frontend/src/App.tsx frontend/src/main.tsx
git commit -m "feat: add merchants page with routing"
```

---

## Task 17: Frontend Dockerfile & nginx config

**Files:**
- Create: `frontend/nginx.conf`
- Create: `frontend/Dockerfile`

- [ ] **Step 1: Create `frontend/nginx.conf`**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://backend:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 2: Create `frontend/Dockerfile`**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] **Step 3: Commit**

```bash
git add frontend/nginx.conf frontend/Dockerfile
git commit -m "feat: add frontend Dockerfile and nginx config"
```

---

## Task 18: Docker Compose

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create `docker-compose.yml`**

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
      - SPRING_DATASOURCE_URL=${SPRING_DATASOURCE_URL:-jdbc:oracle:thin:@//host:1521/service}
      - SPRING_DATASOURCE_USERNAME=${SPRING_DATASOURCE_USERNAME:-payadmin}
      - SPRING_DATASOURCE_PASSWORD=${SPRING_DATASOURCE_PASSWORD:-payadmin}
      - SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI=${KEYCLOAK_ISSUER_URI:-http://localhost:8180/realms/payadmin}
```

- [ ] **Step 2: Verify compose config**

Run: `cd /mnt/c/work/payadmin && docker compose config`

Expected: Valid YAML output with both services

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add docker-compose with frontend and backend services"
```

---

## Task 19: Environment Configuration

**Files:**
- Create: `frontend/.env.example`
- Create: `.env.example`

- [ ] **Step 1: Create `frontend/.env.example`**

```env
VITE_KEYCLOAK_URL=http://localhost:8180
VITE_KEYCLOAK_REALM=payadmin
VITE_KEYCLOAK_CLIENT_ID=payadmin-frontend
```

- [ ] **Step 2: Create `.env.example`**

```env
SPRING_DATASOURCE_URL=jdbc:oracle:thin:@//localhost:1521/XEPDB1
SPRING_DATASOURCE_USERNAME=payadmin
SPRING_DATASOURCE_PASSWORD=payadmin
KEYCLOAK_ISSUER_URI=http://localhost:8180/realms/payadmin
```

- [ ] **Step 3: Add `.env` to `.gitignore`**

Append to `.gitignore`:

```
# Environment
.env
frontend/.env
```

- [ ] **Step 4: Commit**

```bash
git add frontend/.env.example .env.example .gitignore
git commit -m "feat: add environment configuration examples"
```
