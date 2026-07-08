"""Шифрование секретов интеграций и уведомлений (пароль SMTP, токены ботов, вебхуки) в БД.

В отличие от токенов вида IntegrationToken (которые только сверяются по хэшу), эти секреты
приложение должно уметь расшифровать, чтобы реально ими воспользоваться - поэтому здесь
обратимое шифрование (Fernet), а не хэш. Ключ живет в переменной окружения FIELD_ENCRYPTION_KEY,
не в коде и не в БД - как DJANGO_SECRET_KEY. Это не защита от полностью скомпрометированного
сервера (тогда ключ и так доступен), а защита от утечки только БД (дамп, бэкап, SQL-инъекция)
и от того, что секрет виден кому-то, кто просто открыл таблицу в БД или Django Admin.
"""

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


class EncryptionKeyMissing(ImproperlyConfigured):
    pass


def _fernet():
    key = settings.FIELD_ENCRYPTION_KEY
    if not key:
        raise EncryptionKeyMissing(
            "FIELD_ENCRYPTION_KEY не задан - сгенерируйте: "
            "python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\" "
            "и добавьте в .env"
        )
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt(plaintext):
    if not plaintext:
        return ""
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt(ciphertext):
    if not ciphertext:
        return ""
    try:
        return _fernet().decrypt(ciphertext.encode()).decode()
    except InvalidToken:
        raise EncryptionKeyMissing(
            "Не удалось расшифровать секрет - FIELD_ENCRYPTION_KEY изменился или неверен"
        )
