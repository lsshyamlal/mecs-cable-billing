# Local development on this Mac

Use this checklist before starting MECS development. These commands use the installed Homebrew PostgreSQL 17 and Java 25, plus the repository's existing `.env` file.

## 1. Check and start PostgreSQL

Run from any directory:

```bash
/opt/homebrew/opt/postgresql@17/bin/pg_ctl \
  -D /opt/homebrew/var/postgresql@17 \
  status
```

If it reports `no server running`, start it:

```bash
/opt/homebrew/opt/postgresql@17/bin/pg_ctl \
  -D /opt/homebrew/var/postgresql@17 \
  -l /opt/homebrew/var/postgresql@17/server.log \
  start
```

Wait for `server started`. If it is already running, skip the start command.

This uses the existing database directory and bypasses the Homebrew service-manager error `undefined method 'stop_timeout'`. It does not update Homebrew, recreate databases, or register a service to start at login. PostgreSQL runs in the background until stopped or the machine shuts down.

**Scope:** this is a shared PostgreSQL instance on your Mac. Other local applications may also use it.

## 2. Start the backend — terminal 1

```bash
cd /Users/shyamlallakshmiramiyasridhar/Documents/Technology_Playground/mecs_billing_software/mecs-cable-billing

export JAVA_HOME=/opt/homebrew/opt/openjdk@25/libexec/openjdk.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:$PATH"

set -a
source .env
set +a

mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Leave this terminal running. The backend listens on **http://localhost:9090**.

- `.env` supplies `MECS_DB_USER`, `MECS_DB_PASS`, and `MECS_JWT_SECRET`. Keep it private; do not commit it.
- The default database is `mecs_db` at `localhost:5432`. `MECS_DB_HOST`, `MECS_DB_PORT`, and `MECS_DB_NAME`, if set in the environment, override these defaults.
- Confirm the connection targets a dedicated local development database. Backend startup applies Flyway migrations to that database. The dev profile also resets the existing `admin@mecs.com` account's password to `admin123`.
- While the backend is running, the billing scheduler can modify subscription records at 3 AM IST. Using the app also writes to the configured database.
- The Java selection and exported environment variables apply only to this terminal and its child processes; they do not permanently change your shell configuration.

## 3. Start the frontend — terminal 2

```bash
cd /Users/shyamlallakshmiramiyasridhar/Documents/Technology_Playground/mecs_billing_software/mecs-cable-billing/frontend

npm run dev
```

Dependencies are already installed on this Mac. On a fresh checkout, or after dependency changes, run `npm ci` in `frontend` before starting Vite.

Leave this terminal running. Open **http://localhost:3000**. The frontend forwards `/api` requests to the backend at port 9090. If Vite reports a different port because 3000 is occupied, stop and check which process is using 3000 before continuing.

## 4. Sign in

For the existing development admin account:

- Email: `admin@mecs.com`
- Password: `admin123`

The dev initializer only resets an account that already exists; it does not create one. A fresh database needs an admin provisioned separately.

## 5. Stop development

1. Press **Ctrl+C** in the frontend terminal.
2. Press **Ctrl+C** in the backend terminal.
3. If no other local app needs PostgreSQL, stop it:

```bash
/opt/homebrew/opt/postgresql@17/bin/pg_ctl \
  -D /opt/homebrew/var/postgresql@17 \
  stop
```

Stopping PostgreSQL disconnects all applications using this instance. Closing the backend terminal does not stop PostgreSQL. Database changes persist after shutdown.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Homebrew reports `undefined method 'stop_timeout'` | Use the direct `pg_ctl` commands above. |
| PostgreSQL fails to start | Read the recent log with `tail -n 50 /opt/homebrew/var/postgresql@17/server.log`. |
| Backend cannot connect to PostgreSQL | Check `pg_ctl status`, database host/port, and credentials in `.env`. |
| Database `mecs_db` does not exist | Database provisioning is needed; migrations create application tables, not the database itself. |
| Java runtime is missing or the wrong version is selected | Repeat the `JAVA_HOME` and `PATH` exports, then check `java -version` and `mvn -version`. |
| Port 9090 or 3000 is already occupied | Inspect with `lsof -nP -iTCP:9090 -iTCP:3000 -sTCP:LISTEN`; stop only processes you recognize. |
| Admin login fails on a fresh database | The development admin account must exist before the dev initializer can reset its password. |

Do not run `scripts/reset_test_data.sql` as a startup step: it resets test data and is not needed for normal development.
