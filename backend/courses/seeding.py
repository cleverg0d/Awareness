from courses.models import Chapter, Choice, Course, Question


def seed_courses(stdout, style, courses_data):
    """Общий загрузчик для seed_*_courses команд - курс/главы/вопросы/варианты, идемпотентно."""
    for course_data in courses_data:
        course, created = Course.objects.get_or_create(
            title=course_data["title"], defaults={"description": course_data["description"], "is_active": True}
        )
        if not created:
            course.description = course_data["description"]
            course.is_active = True
            course.save(update_fields=["description", "is_active"])

        chapters_by_key = {}
        for order, chap in enumerate(course_data["chapters"]):
            chapter, _ = Chapter.objects.update_or_create(
                course=course,
                title=chap["title"],
                defaults={"order": order, "content": chap["content"].strip()},
            )
            chapters_by_key[chap["key"]] = chapter

        created_questions = 0
        for q in course_data["questions"]:
            question, q_created = Question.objects.get_or_create(
                course=course,
                text=q["text"],
                defaults={
                    "chapter": chapters_by_key[q["chapter"]],
                    "question_type": q["type"],
                    "is_active": True,
                },
            )
            if not q_created:
                question.chapter = chapters_by_key[q["chapter"]]
                question.question_type = q["type"]
                question.is_active = True
                question.save(update_fields=["chapter", "question_type", "is_active"])
                question.choices.all().delete()
            else:
                created_questions += 1

            for order, (text, is_correct) in enumerate(q["choices"]):
                Choice.objects.create(question=question, text=text, is_correct=is_correct, order=order)

        stdout.write(
            style.SUCCESS(
                f"Курс '{course.title}': {len(chapters_by_key)} глав, {len(course_data['questions'])} вопросов "
                f"({created_questions} новых)."
            )
        )
