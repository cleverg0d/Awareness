from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator

MAX_ICON_SIZE_MB = 5

validate_icon_extension = FileExtensionValidator(["png", "jpg", "jpeg", "webp", "gif"])


def validate_icon_size(value):
    limit = MAX_ICON_SIZE_MB * 1024 * 1024
    if value.size > limit:
        raise ValidationError(f"Размер файла не должен превышать {MAX_ICON_SIZE_MB} МБ.")
