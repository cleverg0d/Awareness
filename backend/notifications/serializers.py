from rest_framework import serializers

from .models import EmailSettings, NotificationLog, SlackSettings, TeamsSettings, TelegramSettings


class EmailSettingsSerializer(serializers.ModelSerializer):
    # write_only + не возвращаем реальное значение - только флаг, задан ли пароль, как в LDAP.
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password_set = serializers.SerializerMethodField()

    class Meta:
        model = EmailSettings
        fields = [
            "enabled",
            "smtp_host",
            "smtp_port",
            "use_tls",
            "username",
            "password",
            "password_set",
            "from_email",
            "from_name",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]

    def get_password_set(self, obj):
        return obj.password_set

    def update(self, instance, validated_data):
        new_password = validated_data.pop("password", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if new_password:
            instance.password = new_password
        instance.save()
        return instance


class TelegramSettingsSerializer(serializers.ModelSerializer):
    bot_token = serializers.CharField(write_only=True, required=False, allow_blank=True)
    bot_token_set = serializers.SerializerMethodField()

    class Meta:
        model = TelegramSettings
        fields = ["enabled", "bot_token", "bot_token_set", "chat_id", "updated_at"]
        read_only_fields = ["updated_at"]

    def get_bot_token_set(self, obj):
        return obj.bot_token_set

    def update(self, instance, validated_data):
        new_token = validated_data.pop("bot_token", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if new_token:
            instance.bot_token = new_token
        instance.save()
        return instance


class SlackSettingsSerializer(serializers.ModelSerializer):
    webhook_url = serializers.CharField(write_only=True, required=False, allow_blank=True)
    webhook_url_set = serializers.SerializerMethodField()

    class Meta:
        model = SlackSettings
        fields = ["enabled", "webhook_url", "webhook_url_set", "updated_at"]
        read_only_fields = ["updated_at"]

    def get_webhook_url_set(self, obj):
        return obj.webhook_url_set

    def update(self, instance, validated_data):
        new_url = validated_data.pop("webhook_url", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if new_url:
            instance.webhook_url = new_url
        instance.save()
        return instance


class TeamsSettingsSerializer(serializers.ModelSerializer):
    webhook_url = serializers.CharField(write_only=True, required=False, allow_blank=True)
    webhook_url_set = serializers.SerializerMethodField()

    class Meta:
        model = TeamsSettings
        fields = ["enabled", "webhook_url", "webhook_url_set", "updated_at"]
        read_only_fields = ["updated_at"]

    def get_webhook_url_set(self, obj):
        return obj.webhook_url_set

    def update(self, instance, validated_data):
        new_url = validated_data.pop("webhook_url", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if new_url:
            instance.webhook_url = new_url
        instance.save()
        return instance


class NotificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationLog
        fields = ["id", "channel", "event", "target", "success", "message", "created_at"]
        read_only_fields = fields
