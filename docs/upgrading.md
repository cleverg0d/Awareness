# Upgrading

[Русский](upgrading.ru.md)

Data (employees, courses, quiz results, integration and notification secrets) lives in three named
Docker volumes declared in `docker-compose.yml`: `pg_data` (the Postgres database), `media_data`
(chapter images), and `static_data`. Rebuilding images doesn't touch them - a volume is only
recreated if you explicitly delete it. That's the one rule that matters.

## The one genuinely dangerous action

**Never run `docker compose down -v` or `docker volume rm` on a production deployment.** The `-v`
flag deletes all three volumes, database included, permanently. A plain `docker compose down`
(without `-v`) is safe - volumes stay on disk.

## Routine upgrade

1. Check [CHANGELOG.md](../CHANGELOG.md) - if the version you're upgrading to has an "Upgrade
   notes" section, do whatever manual step it describes first (e.g. a new required env var).
2. Back up the database (see below) - as a safety net, not because upgrades usually break
   anything.
3. Pull the new code and rebuild:
   ```bash
   git pull
   docker compose up -d --build
   ```
   On startup, the `backend` container applies any pending database migrations
   (`python manage.py migrate`) and collects static files on its own - nothing to run by hand.
4. Check the version shown at the bottom of the console sidebar or in the Django Admin header - it
   should match what you just deployed.

If the frontend nginx returns 502 for API calls right after rebuilding `backend`, but backend's own
logs look clean, restart the frontend: `docker compose restart frontend`. This isn't data loss -
nginx just cached the old backend container's IP during the rebuild.

## Database backup and restore

Back up before upgrading:

```bash
docker compose exec db pg_dump -U awareness awareness > backup-$(date +%Y-%m-%d).sql
```

Restore (if something goes wrong - roll back the code to the previous version first, then the
database):

```bash
git checkout v1.0.0   # the previous tag you're rolling back to
docker compose up -d --build
cat backup-2026-07-07.sql | docker compose exec -T db psql -U awareness awareness
```

## Versioning

The project follows [Semantic Versioning](https://semver.org/) and tags releases in git (`v1.0.0`,
`v1.1.0`, ...). Development happens on `main`; a tag is a specific, frozen version. For a
production deployment, it's better to deploy from a specific tag than a moving `main`:

```bash
git fetch --tags
git checkout v1.0.0
docker compose up -d --build
```

The changes in each version are listed in [CHANGELOG.md](../CHANGELOG.md). If a version breaks
backward compatibility (a required env var is renamed, a manual data migration is needed, etc.),
it's a MAJOR version bump (the first number), and its CHANGELOG entry will always describe what to
do by hand before upgrading.
