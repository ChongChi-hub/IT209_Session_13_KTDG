# Stage 1: Build application with Gradle
FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /app

# Copy gradle wrapper and config files
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle

# Grant execute permission
RUN chmod +x gradlew

# Download dependencies
RUN ./gradlew dependencies --no-daemon || true

# Copy source code and build jar
COPY src ./src
RUN ./gradlew bootJar -x test --no-daemon

# Stage 2: Runtime image
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy compiled jar
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
