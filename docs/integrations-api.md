# Integrations API

[Русский](integrations-api.ru.md)

A small API that lets a trusted external service assign security-awareness training to an
employee. Intended for tools like a password-policy auditor that wants to enroll employees who
fail its checks into a relevant course. This is a service-to-service API authenticated with a
bearer token, separate from the regular user-facing session login, and it is not meant to be
called from a browser.

## Getting a token

An administrator creates a token from the console at `/console/integrations`, naming it and
choosing which courses it is allowed to assign. The token is shown once, at creation time, so
store it securely, for example in your service's secret manager. If it leaks, the blast radius is
limited to the courses it was scoped to; ask an administrator to revoke it and issue a new one.

## Authentication

Send the token as a bearer token on every request:

```
Authorization: Bearer awr_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Endpoints

The base URL is `https://<your-awareness-host>/api/integrations/v1/`.

`GET courses/` lists the courses your token is allowed to assign, useful for looking up a course
id instead of hardcoding it. It responds with an array of objects such as
`{ "id": 4, "title": "Памятка по парольной защите" }`.

`POST assign-training/` assigns an employee to a course and is idempotent, so calling it again for
the same employee and course does not create a duplicate assignment. The request body looks like
`{ "employee_email": "employee@company.local", "course": 4, "reason": "10+ weak passwords found in
the latest audit" }`, where `reason` is optional free text stored in the audit log for
traceability and never shown to the employee. A successful response returns status 201 if a new
assignment was created or 200 if the employee was already assigned, with a body such as
`{ "wave_id": 12, "wave_name": "Автоматическое назначение: Памятка по парольной защите",
"assignment_id": 87, "created": true }`.

A 401 response means the token is missing, invalid, or revoked. A 404 response covers three
distinct situations on purpose: the employee wasn't found or is inactive, the course wasn't found
or is inactive, or the course simply isn't in this token's allowed list. These are deliberately
indistinguishable from each other, so a leaked token can't be used to enumerate employee emails or
discover courses outside its scope; the specific reason is still visible to an administrator in
the console's integration log. A 429 response means the rate limit was exceeded.

## Rate limits

The default is 60 requests per hour per token. If you need a higher limit for a legitimate bulk
use case, ask an administrator: this is a Django REST Framework throttle scope named
`integration` and can be adjusted in `backend/config/settings.py`.

## Auditing

Every call, successful or not, is logged with the token used, the employee, the course, and the
outcome. Administrators can see this log in the console next to the token list.
