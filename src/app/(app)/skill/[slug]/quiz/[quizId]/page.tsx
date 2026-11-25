import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLearnerQuiz, getTrackDetail } from "@/lib/skill/actions";
import { QuizClient } from "./QuizClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string; quizId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { quizId } = await params;
  const quiz = await getLearnerQuiz(quizId);

  return {
    title: quiz ? `${quiz.title} — Zed Skill` : "Quiz — Zed Skill",
  };
}

export default async function QuizPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { slug, quizId } = await params;
  const [quiz, trackData] = await Promise.all([
    getLearnerQuiz(quizId),
    getTrackDetail(slug),
  ]);

  if (!quiz || !trackData) {
    notFound();
  }

  return <QuizClient track={trackData.track} quiz={quiz} />;
}
