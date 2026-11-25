import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTrackDetail } from "@/lib/skill/actions";
import { LessonPlayerClient } from "./LessonPlayerClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string; lessonId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, lessonId } = await params;
  const data = await getTrackDetail(slug);
  const lesson = data?.lessons.find((l) => l.id === lessonId);

  return {
    title: lesson
      ? `${lesson.title} — ${data?.track.title ?? "Zed Skill"}`
      : "Lesson — Zed Skill",
  };
}

export default async function LessonPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { slug, lessonId } = await params;
  const data = await getTrackDetail(slug);

  if (!data) {
    notFound();
  }

  const lessonIndex = data.lessons.findIndex((l) => l.id === lessonId);
  if (lessonIndex === -1) {
    notFound();
  }

  const lesson = data.lessons[lessonIndex];
  const isLocked =
    lessonIndex > 0 &&
    !data.lessons[lessonIndex - 1].completed &&
    !lesson.completed;

  const lessonQuiz =
    data.quizzes.find((q) => q.lesson_id === lesson.id) ?? null;
  const nextLesson =
    lessonIndex < data.lessons.length - 1
      ? data.lessons[lessonIndex + 1]
      : null;

  return (
    <LessonPlayerClient
      track={data.track}
      lesson={lesson}
      lessonIndex={lessonIndex}
      totalLessons={data.lessons.length}
      isLocked={isLocked}
      lessonQuiz={lessonQuiz}
      nextLessonId={nextLesson?.id ?? null}
    />
  );
}
