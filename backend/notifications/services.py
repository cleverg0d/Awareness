"""Отправка уведомлений по настроенным каналам. Секреты (пароль SMTP, токены, вебхуки)
задает только администратор через консоль - как URI сервера в LDAP-настройках, это доверенный
ввод, а не значение из внешнего запроса, поэтому здесь нет проверки на SSRF и т.п."""

import json
import urllib.request

from django.core.mail import EmailMessage, get_connection

from .models import EmailSettings, NotificationLog, SlackSettings, TeamsSettings, TelegramSettings


class NotificationError(Exception):
    """Ошибка отправки - используется тестовыми эндпоинтами, чтобы показать причину админу."""


def _log(channel, event, target, success, message):
    NotificationLog.objects.create(channel=channel, event=event, target=target, success=success, message=message[:500])


def _post_json(url, payload, timeout=10):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode()


def _send_email_raw(email_settings, to_email, subject, body):
    connection = get_connection(
        backend="django.core.mail.backends.smtp.EmailBackend",
        host=email_settings.smtp_host,
        port=email_settings.smtp_port,
        username=email_settings.username,
        password=email_settings.password,
        use_tls=email_settings.use_tls,
    )
    from_header = (
        f"{email_settings.from_name} <{email_settings.from_email}>"
        if email_settings.from_name
        else email_settings.from_email
    )
    EmailMessage(subject, body, from_header, [to_email], connection=connection).send()


def _send_telegram_raw(telegram_settings, text):
    url = f"https://api.telegram.org/bot{telegram_settings.bot_token}/sendMessage"
    body = _post_json(url, {"chat_id": telegram_settings.chat_id, "text": text})
    if not json.loads(body).get("ok"):
        raise NotificationError(body)


def _send_slack_raw(slack_settings, text):
    _post_json(slack_settings.webhook_url, {"text": text})


def _send_teams_raw(teams_settings, text):
    _post_json(teams_settings.webhook_url, {"text": text})


def send_email(to_email, subject, body, event="generic"):
    """Событийная отправка - молча ничего не делает, если канал выключен (не настроен)."""
    email_settings = EmailSettings.get_solo()
    if not email_settings.enabled:
        return False
    try:
        _send_email_raw(email_settings, to_email, subject, body)
    except Exception as exc:
        _log("email", event, to_email, False, str(exc))
        return False
    _log("email", event, to_email, True, "Отправлено")
    return True


def send_telegram(text, event="generic"):
    telegram_settings = TelegramSettings.get_solo()
    if not telegram_settings.enabled:
        return False
    try:
        _send_telegram_raw(telegram_settings, text)
    except Exception as exc:
        _log("telegram", event, telegram_settings.chat_id, False, str(exc))
        return False
    _log("telegram", event, telegram_settings.chat_id, True, "Отправлено")
    return True


def send_slack(text, event="generic"):
    slack_settings = SlackSettings.get_solo()
    if not slack_settings.enabled:
        return False
    try:
        _send_slack_raw(slack_settings, text)
    except Exception as exc:
        _log("slack", event, "webhook", False, str(exc))
        return False
    _log("slack", event, "webhook", True, "Отправлено")
    return True


def send_teams(text, event="generic"):
    teams_settings = TeamsSettings.get_solo()
    if not teams_settings.enabled:
        return False
    try:
        _send_teams_raw(teams_settings, text)
    except Exception as exc:
        _log("teams", event, "webhook", False, str(exc))
        return False
    _log("teams", event, "webhook", True, "Отправлено")
    return True


def broadcast_admin_channels(text, event="generic"):
    """Шлет одно и то же сообщение во все включенные админ-каналы (Telegram/Slack/Teams)."""
    send_telegram(text, event=event)
    send_slack(text, event=event)
    send_teams(text, event=event)


def test_email(to_email):
    """Ручная проверка из консоли - шлет независимо от enabled, чтобы можно было проверить
    настройки до того, как включать канал для всех."""
    email_settings = EmailSettings.get_solo()
    try:
        _send_email_raw(email_settings, to_email, "Тестовое уведомление Awareness", "Это тестовое сообщение из консоли администратора Awareness.")
    except Exception as exc:
        _log("email", "test", to_email, False, str(exc))
        raise NotificationError(str(exc)) from exc
    _log("email", "test", to_email, True, "Отправлено")


def test_telegram():
    telegram_settings = TelegramSettings.get_solo()
    try:
        _send_telegram_raw(telegram_settings, "Тестовое уведомление из консоли Awareness.")
    except Exception as exc:
        _log("telegram", "test", telegram_settings.chat_id, False, str(exc))
        raise NotificationError(str(exc)) from exc
    _log("telegram", "test", telegram_settings.chat_id, True, "Отправлено")


def test_slack():
    slack_settings = SlackSettings.get_solo()
    try:
        _send_slack_raw(slack_settings, "Тестовое уведомление из консоли Awareness.")
    except Exception as exc:
        _log("slack", "test", "webhook", False, str(exc))
        raise NotificationError(str(exc)) from exc
    _log("slack", "test", "webhook", True, "Отправлено")


def test_teams():
    teams_settings = TeamsSettings.get_solo()
    try:
        _send_teams_raw(teams_settings, "Тестовое уведомление из консоли Awareness.")
    except Exception as exc:
        _log("teams", "test", "webhook", False, str(exc))
        raise NotificationError(str(exc)) from exc
    _log("teams", "test", "webhook", True, "Отправлено")
