FROM maven:3.9-eclipse-temurin-17 AS build

# Grab proxy CA certs and import into JVM truststore
RUN echo | openssl s_client -showcerts -connect repo.maven.apache.org:443 2>/dev/null \
    | awk '/BEGIN CERTIFICATE/,/END CERTIFICATE/{ print > "/tmp/cert-" ++n ".pem" }' \
    && for f in /tmp/cert-*.pem; do \
         echo "Importing $f ..."; \
         openssl x509 -in "$f" -noout -subject -issuer; \
         keytool -importcert -noprompt -trustcacerts \
           -alias "proxy-$(basename $f .pem)" \
           -file "$f" \
           -keystore "$JAVA_HOME/lib/security/cacerts" \
           -storepass changeit; \
       done

WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B || mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
