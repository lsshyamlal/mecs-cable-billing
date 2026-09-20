# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1 — Build the React/Vite SPA.
# vite.config.js outputs to ../src/main/resources/static, so the build lands
# at /app/src/main/resources/static inside this stage.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
COPY docs/ /app/docs/
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2 — Build the Spring Boot fat JAR (JDK 25 + Maven).
# No Maven wrapper in the repo, so we use the maven base image.
# ---------------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app
# Cache dependencies first for faster rebuilds when only source changes.
COPY pom.xml ./
RUN mvn -B -q dependency:go-offline
COPY src ./src
# Overlay the freshly built SPA over the committed static assets.
COPY --from=frontend /app/src/main/resources/static ./src/main/resources/static
RUN mvn -B -q clean package -DskipTests

# ---------------------------------------------------------------------------
# Stage 3 — Runtime (slim JRE).
# ---------------------------------------------------------------------------
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/target/billing-*.jar app.jar
ENV TZ=Asia/Kolkata
EXPOSE 8080
# Render injects $PORT; default to 8080 for local `docker run`.
# Stays on the default Spring profile (binds 0.0.0.0); do NOT activate `prod`,
# which binds 127.0.0.1 only and would be unreachable by Render's router.
ENTRYPOINT ["sh", "-c", "java -Duser.timezone=Asia/Kolkata -jar app.jar --server.port=${PORT:-8080}"]
