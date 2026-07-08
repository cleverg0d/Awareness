# Administrator guide

[Русский](admin-guide.ru.md)

A step-by-step process from the first run to the day-to-day work of training employees. Assumes
the portal is already deployed (see the [README](../README.md)).

## First login

The only step still done through `manage.py` is creating the first administrator:

```bash
docker compose exec backend python manage.py createsuperuser
```

Then sign in at `http://<your-host>/console/` with that account. Everything else is configured in
the console itself.

## Employees and departments

There are two ways to onboard employees. The first is manually or via CSV import through Django
Admin (`/admin/`), where the "Employees" and "Departments" sections support import/export. The
second is through LDAP or Active Directory, under the console's "Integrations → LDAP / Active
Directory" section: enter the server URI, a service account for binding, the user search base and
filter, and the attributes for full name, email, and department, then enable LDAP/AD sign-in.
Employees who don't exist yet are created automatically on their first domain login, and settings
take effect immediately without restarting containers, so you can hit "Test connection" before
saving anything.

Login is also protected against password guessing: after 5 wrong passwords in a row, that
specific account is locked for 15 minutes, even with the correct password, on top of a per-IP rate
limit on the login endpoint itself. If an employee is legitimately locked out and needs in sooner,
resetting their password from the "Employees" section also clears the lockout. If you're the
locked-out account yourself (someone guessing your own password, or your own typo) and can't use
that console flow on yourself, run this from wherever the containers are deployed:

```bash
docker compose exec backend python manage.py unlock_account admin@yourcompany.com
```

## Roles

Employees have three access levels: a regular employee just takes assigned training and never sees
the console; a training manager sees Dashboard, Waves, Courses, and At-risk employees, and can
create courses and launch waves; an admin sees all of that plus the Employees, Integrations, and
Notifications sections, LDAP setup, and Django Admin. Change a role from the "Employees" section
using the dropdown next to the person - it takes effect immediately, no restart needed. An admin
can't demote themselves, so you can't accidentally lock yourself out of the console.

## Creating a course

In the "Courses" section, click "Create course". On the course page, the title and description
are edited in place with a pencil button. Each chapter has a full editor with headings, lists,
links, and images instead of plain text, and questions support one or multiple correct answers. A
question can be temporarily hidden from the quiz with the eye icon without deleting it. Every
chapter needs at least one active question - otherwise a wave for that course can't be launched,
and the platform will tell you exactly which chapter is missing one.

## Launching training

The easiest path is clicking "Launch training" right on the course page: it creates a wave with a
thirty-day deadline and takes you to its settings. From the wave page you can assign specific
employees, whole departments, or every active employee at once, set a passing threshold as a
percentage of correct answers and an attempt limit (blank means unlimited), then switch the wave to
"Active" once assignments are ready, since employees can't see it before that.

Waves and courses are deliberately separate entities: one course can be reused across several
campaigns, such as an annual briefing or a targeted rollout to one department, and each campaign
keeps its own audit trail of who took it, when, and with what result.

## Monitoring

The dashboard shows a summary across all waves at once (statuses, departments, score distribution)
and for a single selected wave. The "At-risk employees" section collects a cross-wave list of
everyone who never passed or didn't pass on the first attempt. CSV export of a wave's results is
available from a button on the wave or dashboard page.

## Notifications

Each channel under "Notifications" is enabled independently and doesn't affect the others. Email
over SMTP needs your mail server's host, port, username, and password, and once set an employee
gets an email when assigned to training and a reminder three days before the deadline. Telegram
needs a bot created through [@BotFather](https://t.me/BotFather), with its token and the chat ID of
the group or channel where the bot will post the overdue-waves digest. Slack and Microsoft Teams
use an Incoming Webhook URL created in that messenger's own channel settings.

The "Send test" button verifies a channel before you enable it for everyone. Passwords, tokens,
and webhooks are never shown again, only a "already set" flag. Overdue digests and employee
reminders are sent automatically once a day by the background `scheduler` service (see
`docker-compose.yml`), nothing else needs to be started manually.

## API integrations

If you have your own script or service that needs to automatically assign training, such as a
password-policy auditor that finds weak passwords and wants to enroll the employee in a
password-hygiene course right away, create a token under "Integrations → API tokens" scoped to
only the courses it needs, and hand it to whoever owns that service. The request format is
described in [docs/integrations-api.md](integrations-api.md).

## Branding and language

The logo and favicon live at `frontend/public/brand/*.png`; replace them with your own light and
dark variants. The interface switches between Russian and English from the profile menu, visible
to both employees and administrators.
