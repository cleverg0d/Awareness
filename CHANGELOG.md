# Changelog

[Русский](CHANGELOG.ru.md)

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), this project follows
[Semantic Versioning](https://semver.org/): MAJOR - breaking changes (manual steps needed on
upgrade), MINOR - new backward-compatible features, PATCH - fixes only. The current version is
shown at the bottom of the console sidebar and in the Django Admin header, and is also available
at `GET /api/health/`. Before upgrading, always check [docs/upgrading.md](docs/upgrading.md)
and the "Upgrade notes" section below for the target version, if it has one.

Each entry is marked: ✚ for an added capability, ✓ for something fixed or improved. Security fixes
are intentionally not itemized here, even in general terms - details of patched vulnerabilities
aren't published, so as not to point anyone still on an older version at what to look for.

## [Unreleased]

Nothing planned yet.

## [1.4.0] - 2026-07-13

✚ Badges for completing courses - the admin sets an icon and an earning condition: a specific
course, any course, or a specific wave (recurring annual/quarterly mandatory courses can have a
distinct badge per cycle, without duplicating on an honest retake). Every employee gets a public
confirmation page for an earned badge; a badge's icon can be reused from its course's icon in one
click.

✚ Courses now have an icon - shown on course cards in the employee portal and the console,
uploaded right from the course page.

✚ Employee leaderboard by percentage of courses passed - company-wide and by department. Off by
default since it's an HR-sensitive topic; when enabled, employees see the top 10 and their own
rank, not the full list.

✚ Focus control during a quiz - switching to another window or tab while taking a quiz is
recorded.

✚ The dashboard now has a period filter and more expressive colored status tiles.

✚ "Training waves", "Courses", "Badges", and "Leaderboard" are now grouped under one "Training"
menu item with tabs - they used to be 4 separate sidebar items for what was really the same work.

✓ The console is now responsive - tables scroll horizontally on narrow screens, forms collapse to
a single column. The mobile sidebar is now a persistent narrow icon rail instead of an off-canvas
drawer, with manual collapse on desktop.

✓ The employee settings page was redesigned - a personal info card, a compact theme card, a more
compact password-change form.

✓ Uploaded image size is now limited - badge icons, course icons, and images in the chapter
editor.

## [1.2.5] - 2026-07-13

✓ README and `.env.example` didn't say that `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and
`CSRF_TRUSTED_ORIGINS` need to be changed when deploying anywhere other than `localhost` - a
Docker install on a real server would load the frontend fine but fail every API call, starting
with login, with Django's generic "Bad Request (400)" page.

## [1.2.4] - 2026-07-08

✓ `manage.py createsuperuser` crashed with `TypeError: ... missing 1 required positional
argument: 'username'` on a fresh database - fixed. Docs also updated to say "Security" and "Logs"
instead of the old "Integrations" location for the login-lockout toggle and log.

## [1.2.2] - 2026-07-08

✓ Login protection (account lockout) moved out of "Integrations" into its own "Security" section -
it isn't really an external integration, and this leaves room for more security settings later.

## [1.2.1] - 2026-07-08

✓ The sign-in, integration, and notification logs were scattered across three different console
pages - they now live together under a single "Logs" section, with the settings that used to sit
next to them staying where they were.

✓ The upgrade instructions only covered the Docker path - added the equivalent steps for a manual
(non-Docker) installation.

## [1.2.0] - 2026-07-08

✚ The new account-lockout protection can be switched off from "Integrations → Login protection"
if it ever gets in the way, without losing the per-IP rate limit on the login page.

✚ A login log now records every attempt, successful or not, with the email used and the source
IP, viewable from the same section.

## [1.1.0] - 2026-07-08

✚ Login is now protected against password guessing at the account level, not just per IP: after 5
wrong passwords in a row, that account is locked for 15 minutes regardless of which IP the next
attempt comes from. Resetting an employee's password from the console also clears an active
lockout.

## [1.0.1] - 2026-07-07

✓ Removed technical details of pre-release bugs and vulnerabilities from the 1.0.0 entry in this
file, and made the list formatting consistent.

## [1.0.0] - 2026-07-07

First release prepared for real-world use and open-source publication.

✚ Courses made of chapters with a full WYSIWYG editor (text, images, lists, links), questions with
one or multiple correct answers.

✚ Training waves: assign to specific employees, a department, or everyone at once, set a deadline
and attempt limit, launch a campaign with one click from the course page.

✚ Security-manager dashboard: pass/fail/in-progress status, breakdown by department, score
distribution, a separate list of at-risk employees, CSV export of results.

✚ Sign-in via Active Directory / LDAP, configured directly in the console with no config edits.

✚ Roles: employee, training manager, admin - built on Django's built-in permissions, a role can be
changed by an admin from the "Employees" section, no database or Django Admin access needed.

✚ API tokens for external integrations (e.g. a password-policy auditor), scoped to specific courses
at creation time.

✚ Notifications over Email (SMTP), Telegram, Slack, and Microsoft Teams, with channel secrets
encrypted in the database.

✚ Bilingual interface, switching between Russian and English on the fly.

✚ A demo-data seeder command to try out the portal on an empty database without real employees.
