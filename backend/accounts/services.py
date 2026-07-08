import secrets


def get_client_ip(request):
    """nginx всегда стоит перед Django в этом деплое (backend не публикует порт наружу), поэтому
    X-Forwarded-For можно доверять безусловно - REMOTE_ADDR иначе показал бы адрес контейнера
    nginx, а не настоящего клиента."""
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def reset_user_password(user):
    """Генерирует временный пароль, сохраняет и требует смены при следующем входе. Заодно снимает
    блокировку за неудачные попытки входа - иначе сотрудник с новым паролем от админа все равно
    ждал бы окончания старой блокировки."""
    temp_password = secrets.token_urlsafe(9)
    user.set_password(temp_password)
    user.must_change_password = True
    user.failed_login_attempts = 0
    user.locked_until = None
    user.save(update_fields=["password", "must_change_password", "failed_login_attempts", "locked_until"])
    return temp_password
