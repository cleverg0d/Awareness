# Awareness

[Русский](README.ru.md)

An open platform for security-awareness training and testing.

![Awareness dashboard](docs/screenshot-dashboard.png)
*Dashboard with demo data, see the "Demo data" section below to get the same picture locally.*

![Awareness employee portal](docs/screenshot-my-courses.png)
*Employee portal: overall completion percentage, active and completed courses kept separate, search by title.*

## Why this exists

I spent a long time looking for a free, ready-made platform to train company employees on basic
security awareness: something where you upload your own material, assign training to departments,
set a passing threshold, and get a list of who didn't pass at the end. I never found a sane free
alternative, only expensive corporate SaaS or homemade Google Forms with no tracking at all.

So I built one myself, for my own company, and then decided to open it up: anyone with the same
problem is welcome to use it. It's MIT licensed, so anything goes, including commercial use. If
this platform saved you time, a star on the repository would be appreciated.

## What it does

Courses are made of chapters with a full WYSIWYG editor for text, images, lists, and links, and
questions support one or multiple correct answers with a configurable passing threshold. A wave
can't be launched if even one chapter in the course has zero quiz questions - the platform won't
let anyone click through "next-next-finish" without a real comprehension check. Training is
assigned through waves: you can target specific employees, a whole department, or everyone at
once, set a deadline and an attempt limit, and launch a campaign with one click straight from the
course page.

The dashboard for a security manager shows who passed, who failed, and who hasn't started yet,
broken down by department, with a score distribution, a separate list of at-risk employees (those
who never passed or didn't pass on the first try), and CSV export of the results.

Sign-in can be configured through Active Directory or LDAP directly in the admin console, without
touching config files or restarting containers. The interface is bilingual, switching between
Russian and English on the fly.

Roles have three tiers: an employee just takes assigned training, a training manager can run
courses and launch waves without access to employees or integrations, and an admin sees everything
and can assign roles to everyone else right from the console - no database access or Django Admin
needed for that.

API tokens are available for integrating external services. For example, your password-auditor
script can call the API to assign training to an employee; the token is scoped to specific courses
at creation time, so a leak can't be used to assign arbitrary training (details in
[docs/integrations-api.md](docs/integrations-api.md)).

Notifications support Email over SMTP, Telegram, Slack, and Microsoft Teams: an employee gets an
email when assigned to training and a reminder three days before the deadline, while admins get a
digest of overdue waves. All channel secrets are stored encrypted in the database.

Every service, including the reminder scheduler, comes up with one Docker Compose command.

## Stack

The backend is Django, Django REST Framework, and PostgreSQL; the frontend is React, Vite,
TypeScript, and Tailwind CSS. The admin console is a separate React application; Django Admin is
only used for edge cases. Deployment is Docker Compose: nginx, gunicorn, and postgres.

## Quick start (Docker)

```bash
cp .env.example .env
```

In `.env`, make sure to set `DJANGO_SECRET_KEY` (any long random string) and
`FIELD_ENCRYPTION_KEY`, which encrypts passwords and tokens in the "Notifications" section (SMTP,
Telegram, Slack, Teams). Without it the portal still works, but saving a notification secret will
fail with a clear error instead of silently breaking. Generate it with:

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Then:

```bash
docker compose up --build -d
docker compose exec backend python manage.py createsuperuser

# Starter courses (idempotent, safe to re-run):
docker compose exec backend python manage.py seed_ib_course           # security awareness basics 2025
docker compose exec backend python manage.py seed_mailing_courses     # security team mailer memos
docker compose exec backend python manage.py seed_ai_usage_courses    # safe AI usage
```

The portal is at http://localhost:8090/, the admin console at http://localhost:8090/console/, and
Django Admin at http://localhost:8090/admin/.

## Demo data

To make the dashboard and lists look like the screenshot above instead of empty, without having to
create and run real company employees through a test:

```bash
docker compose exec -e ALLOW_DEMO_SEED=true backend python manage.py seed_demo_data
```

This creates about six departments, about twenty-four demo employees, and training results with
varied outcomes: passed on the first try, passed on a retry, failed, or never started. This is not
for production: every demo employee shares the same known password (`Demo12345!`, printed in the
command's output), and the command enrolls fake employees into real active waves, so
`ALLOW_DEMO_SEED=true` is required; without it the command refuses to run so it can't corrupt
statistics on a live database. The command is idempotent for departments and employees, but adds
new quiz attempts on every re-run.

## Manual Installation (without Docker)

`python-ldap` (needed for Active Directory/LDAP login) compiles a C extension against OpenLDAP
headers - the Docker image already has these, but a manual install needs them installed first,
or `pip install` fails with `fatal error: lber.h: No such file or directory`:

```bash
# Debian/Ubuntu
sudo apt install libldap2-dev libsasl2-dev python3-dev libssl-dev
# RHEL/CentOS
sudo dnf install openldap-devel cyrus-sasl-devel python3-devel gcc
# macOS
brew install openldap
export LDFLAGS="-L/usr/local/opt/openldap/lib"
export CPPFLAGS="-I/usr/local/opt/openldap/include"
```

Backend:
```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# needs a local Postgres, see the POSTGRES_* variables in config/settings.py
python manage.py migrate
python manage.py seed_ib_course
python manage.py seed_mailing_courses
python manage.py seed_ai_usage_courses
python manage.py runserver 127.0.0.1:8010
```

Frontend:
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173, /api is proxied to backend :8010
```

Run `npm run dev` (not a bare `npx vite`) after `npm install` has finished - `npx vite` fetches
an isolated standalone copy of Vite that doesn't see this project's own plugins
(`@vitejs/plugin-react`, `@tailwindcss/vite`) and fails with `Could not resolve 'vite'`-style
errors instead. If you're running this inside a VM or a headless box and need to reach the dev
server from your host machine's browser, add `-- --host 0.0.0.0` to the command - by default Vite
only binds to `localhost` inside the VM.

## Documentation

The API contract for external services, including authentication, endpoints, and rate limits, is
described in [docs/integrations-api.md](docs/integrations-api.md). A step-by-step administrator
guide (deployment, LDAP and notification setup, creating a course, launching training, handling
at-risk employees) lives in [docs/admin-guide.md](docs/admin-guide.md). Version history is in
[CHANGELOG.md](CHANGELOG.md), and how to upgrade without losing your database is in
[docs/upgrading.md](docs/upgrading.md).

## Project structure

The backend is split into Django apps. `accounts` handles employees, departments, and
authentication (sessions, CSRF, LDAP/AD); `courses` handles courses, chapters, questions, and
answer choices; `waves` handles training waves, assignments, and the dashboard with CSV export for
the security manager; `quizzes` handles quiz attempts, which become immutable after submission and
serve as an audit trail; `integrations` handles API tokens for external services; `notifications`
handles Email, Telegram, Slack, and Teams delivery. `frontend` is a single SPA that serves both
the employee-facing portal and the admin console.

## Supporting the project

If this platform saved you time and money compared to a corporate SaaS, a star on the repository
would be appreciated, it already helps others find the project.

## License

[MIT](LICENSE): use it however you like, including commercial use, just keep the attribution
notice.
