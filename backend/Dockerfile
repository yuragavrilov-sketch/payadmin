FROM maven:3.9-eclipse-temurin-17 AS build

# SSL bypass for corporate proxy (mirrors .mvn/jvm.config)
ENV JAVA_TOOL_OPTIONS="-Dmaven.resolver.transport=wagon"
ENV MAVEN_OPTS="-Dmaven.wagon.http.ssl.insecure=true -Dmaven.wagon.http.ssl.allowall=true -Dmaven.wagon.http.ssl.ignore.validity.dates=true -Dmaven.wagon.http.retryHandler.count=5"

# Show the certificate chain from Maven Central (to identify proxy CA)
RUN echo | openssl s_client -showcerts -connect repo.maven.apache.org:443 2>/dev/null | openssl x509 -noout -subject -issuer -dates || true

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
