"""Глава курса рендерится сотруднику через dangerouslySetInnerHTML - без серверной санации
редактор консоли можно обойти прямым PATCH-запросом к API и подложить исполняемый код в
контент, который увидят все назначенные на курс сотрудники. Разрешенный набор тегов/атрибутов
соответствует тому, что реально производит редактор (frontend/src/console/components/ChapterContentEditor.tsx)."""

import nh3

ALLOWED_TAGS = {
    "p", "br", "hr",
    "strong", "b", "em", "i", "u", "s", "strike",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "a", "img",
}

ALLOWED_ATTRIBUTES = {
    # rel не перечисляем явно - его форсирует link_rel ниже, nh3 не разрешает оба сразу.
    "a": {"href", "target"},
    "img": {"src", "alt", "title"},
}

ALLOWED_URL_SCHEMES = {"http", "https", "mailto"}


def sanitize_chapter_content(html):
    return nh3.clean(
        html or "",
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        url_schemes=ALLOWED_URL_SCHEMES,
        link_rel="noopener noreferrer",
    )
