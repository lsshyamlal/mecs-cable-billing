# GCP Migration Plan

## Current Setup

- Spring Boot JAR running on a local Mac via systemd-equivalent launchd
- Cloudflare Tunnel (`cloudflared`) routing the public domain to `localhost:8080`
- PostgreSQL running locally
- Mac must be on 24/7 to serve requests

## Target Setup

```
Cloudflare DNS (CNAME → Cloud Run URL)
        ↓
Cloud Run (mecs-billing) — built-in HTTPS, auto-scaled, serverless
        ↓
Cloud SQL (PostgreSQL 14, managed, daily backups)
```

No load balancer. Cloud Run provides a stable HTTPS URL out of the box. Cloudflare points the domain at it via CNAME, keeping DDoS protection and hiding the Cloud Run URL from the public. The `cloudflared` tunnel daemon on the Mac is no longer needed.

**Estimated cost:** ~$10–20/month (Cloud SQL dominates; Cloud Run is nearly free at typical billing-app traffic).

---

## GCP Services Used

| Component | GCP Service |
|---|---|
| Spring Boot app | Cloud Run |
| PostgreSQL | Cloud SQL (db-f1-micro) |
| Secrets (DB creds, JWT) | Secret Manager |
| Docker image registry | Artifact Registry |

---

## Prerequisites

- GCP account created, billing enabled
- `gcloud` CLI installed on Mac (`brew install --cask google-cloud-sdk`)
- Docker installed (`brew install --cask docker`)
- Authenticate once: `gcloud auth login` (opens browser)

---

## Migration Steps

### Step 1 — GCP Project & APIs

```bash
gcloud auth login
gcloud projects create mecs-cable-billing --name="MECS Cable Billing"
gcloud config set project mecs-cable-billing
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com
```

### Step 2 — Cloud SQL (PostgreSQL)

Create via GCP Console → SQL → Create Instance → PostgreSQL 14:
- Instance ID: `mecs-db`
- Region: `asia-south1` (Mumbai — lowest latency from India)
- Machine type: `db-f1-micro`
- Enable automatic daily backups
- Add database flag: `timezone = Asia/Kolkata`

Note the **connection name** shown on the instance overview page (format: `mecs-cable-billing:asia-south1:mecs-db`). Needed in Step 6.

Create the database and user:
```bash
gcloud sql databases create mecs_billing --instance=mecs-db
gcloud sql users create mecs_user --instance=mecs-db --password=YOUR_PASSWORD
```

### Step 3 — Store Secrets

```bash
echo -n "mecs_user"      | gcloud secrets create MECS_DB_USER --data-file=-
echo -n "YOUR_PASSWORD"  | gcloud secrets create MECS_DB_PASS --data-file=-
echo -n "YOUR_JWT_SECRET" | gcloud secrets create MECS_JWT_SECRET --data-file=-
```

### Step 4 — Dockerfile

Add to repo root:

```dockerfile
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY target/mecs-billing.jar app.jar
ENV TZ=Asia/Kolkata
ENTRYPOINT ["java", "-Duser.timezone=Asia/Kolkata", "-jar", "app.jar"]
```

### Step 5 — application.properties (Cloud SQL)

Cloud Run connects to Cloud SQL via a Unix socket (no IP, no firewall rules needed):

```properties
# Cloud SQL socket path injected by Cloud Run at runtime
spring.datasource.url=jdbc:postgresql:///${MECS_DB_NAME}?cloudSqlInstance=${CLOUD_SQL_INSTANCE}&socketFactory=com.google.cloud.sql.postgres.SocketFactory
spring.datasource.username=${MECS_DB_USER}
spring.datasource.password=${MECS_DB_PASS}
```

Add the Cloud SQL socket factory dependency to `pom.xml`:
```xml
<dependency>
  <groupId>com.google.cloud.sql</groupId>
  <artifactId>postgres-socket-factory</artifactId>
  <version>1.15.0</version>
</dependency>
```

### Step 6 — Build and Push Docker Image

```bash
# Create Artifact Registry repo
gcloud artifacts repositories create mecs-repo \
  --repository-format=docker \
  --location=asia-south1

# Build JAR
mvn clean package -DskipTests

# Build and push image
gcloud builds submit \
  --tag asia-south1-docker.pkg.dev/mecs-cable-billing/mecs-repo/mecs-billing
```

### Step 7 — Deploy to Cloud Run

```bash
gcloud run deploy mecs-billing \
  --image asia-south1-docker.pkg.dev/mecs-cable-billing/mecs-repo/mecs-billing \
  --region asia-south1 \
  --add-cloudsql-instances mecs-cable-billing:asia-south1:mecs-db \
  --set-secrets MECS_DB_USER=MECS_DB_USER:latest \
  --set-secrets MECS_DB_PASS=MECS_DB_PASS:latest \
  --set-secrets MECS_JWT_SECRET=MECS_JWT_SECRET:latest \
  --set-env-vars CLOUD_SQL_INSTANCE=mecs-cable-billing:asia-south1:mecs-db \
  --set-env-vars MECS_DB_NAME=mecs_billing \
  --allow-unauthenticated \
  --min-instances 0 \
  --region asia-south1
```

Cloud Run outputs a URL: `https://mecs-billing-xxxx-el.a.run.app`

### Step 8 — Point Cloudflare at Cloud Run

In Cloudflare DNS, remove the old tunnel record and add:

```
Type:    CNAME
Name:    billing   (or your subdomain)
Target:  mecs-billing-xxxx-el.a.run.app
Proxy:   ON (orange cloud)
```

Remove the `cloudflared` tunnel from your Mac — it's no longer needed.

---

## What Changes in the App

| Area | Current | After migration |
|---|---|---|
| DB connection | Local PostgreSQL (`localhost:5432`) | Cloud SQL via Unix socket |
| Secrets | Environment variables on Mac | GCP Secret Manager |
| JWT cookies | `SameSite=Strict`, `Secure=true` | No change needed |
| CORS origin | Cloudflare domain | No change (same domain) |
| Scheduler (3 AM IST) | Local cron / Spring `@Scheduled` | Spring `@Scheduled` still works inside Cloud Run (note: min-instances=0 means the container may be stopped — set min-instances=1 if the scheduler must always fire) |

### Scheduler Note

The 3 AM IST status-transition job (`ACTIVE → GRACE → PAYMENT_PENDING`) must run reliably. With `min-instances=0`, Cloud Run can scale to zero overnight and the scheduler won't fire. Two options:
- Set `--min-instances=1` (keeps one container warm, adds ~$5/month)
- Replace `@Scheduled` with **Cloud Scheduler** → HTTP trigger to a `/internal/run-scheduler` endpoint (preferred, serverless)

---

## Rollback Plan

If anything goes wrong post-migration:
1. Re-enable the `cloudflared` tunnel on the Mac
2. Flip the Cloudflare DNS CNAME back to the tunnel target
3. Debug Cloud Run logs: `gcloud run services logs read mecs-billing --region=asia-south1`

---

## Deferred / Out of Scope

- Load balancer / API Gateway (decided against — Cloud Run URL is sufficient)
- Multi-region deployment
- Cloud CDN for static assets (React is bundled into the JAR)
