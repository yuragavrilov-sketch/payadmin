FROM maven:3.9-eclipse-temurin-17 AS build

# Grab proxy CA certs and import into JVM truststore
RUN echo | openssl s_client -showcerts -connect repo.maven.apache.org:443 2>/dev/null \
    | sed -n '/BEGIN CERTIFICATE/,/END CERTIFICATE/p' > /tmp/chain.pem \
    && i=0 && while openssl x509 -outform PEM -out /tmp/cert-$i.pem -in /tmp/chain.pem 2>/dev/null; do \
         echo "=== Certificate $i ==="; \
         openssl x509 -in /tmp/cert-$i.pem -noout -subject -issuer -dates; \
         keytool -importcert -noprompt -cacerts \
           -alias "proxy-$i" \
           -file /tmp/cert-$i.pem \
           -storepass changeit || true; \
         sed -i '1,/END CERTIFICATE/d' /tmp/chain.pem; \
         i=$((i+1)); \
       done && echo "Imported $i certificate(s)"

WORKDIR /app
COPY .mvn/settings.xml /root/.m2/settings.xml
COPY pom.xml .
RUN mvn -s /root/.m2/settings.xml dependency:go-offline -B || mvn -s /root/.m2/settings.xml dependency:go-offline -B
COPY src ./src
RUN mvn -s /root/.m2/settings.xml package -DskipTests -B

FROM eclipse-temurin:17-jre

# Import proxy CA certs into runtime JVM truststore (for Keycloak HTTPS)
RUN echo | openssl s_client -showcerts -connect keycloak.prod.transcapital.com:443 2>/dev/null \
    | sed -n '/BEGIN CERTIFICATE/,/END CERTIFICATE/p' > /tmp/chain.pem \
    && i=0 && while openssl x509 -outform PEM -out /tmp/cert-$i.pem -in /tmp/chain.pem 2>/dev/null; do \
         keytool -importcert -noprompt -cacerts \
           -alias "keycloak-$i" \
           -file /tmp/cert-$i.pem \
           -storepass changeit || true; \
         sed -i '1,/END CERTIFICATE/d' /tmp/chain.pem; \
         i=$((i+1)); \
       done && rm -f /tmp/chain.pem /tmp/cert-*.pem

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
