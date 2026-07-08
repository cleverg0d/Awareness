import secrets


def reset_user_password(user):
    """Генерирует временный пароль, сохраняет и требует смены при следующем входе."""
    temp_password = secrets.token_urlsafe(9)
    user.set_password(temp_password)
    user.must_change_password = True
    user.save(update_fields=["password", "must_change_password"])
    return temp_password
