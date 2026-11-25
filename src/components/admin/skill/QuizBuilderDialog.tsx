"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Loader2,
  AlertCircle,
  Check,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { AdminQuizItem } from "@/lib/skill/admin-actions";
import {
  adminSaveQuizAction,
  adminDeleteQuizAction,
} from "@/lib/skill/admin-actions";
import { quizSchema } from "@/lib/skill/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DraftQuestion {
  id?: string;
  prompt: string;
  options: string[];
  correct_index: number;
  points: number;
}

interface QuizBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  lessonId: string | null; // null = course final exam
  lessonTitle?: string;
  existingQuiz: AdminQuizItem | null;
  defaultPassMark: number;
  defaultMaxAttempts: number;
  onSaved: () => void;
}

function createEmptyQuestion(): DraftQuestion {
  return {
    prompt: "",
    options: ["", ""],
    correct_index: 0,
    points: 1,
  };
}

export function QuizBuilderDialog({
  open,
  onOpenChange,
  trackId,
  lessonId,
  lessonTitle,
  existingQuiz,
  defaultPassMark,
  defaultMaxAttempts,
  onSaved,
}: QuizBuilderDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [passMark, setPassMark] = useState("");
  const [maxAttempts, setMaxAttempts] = useState("");
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [weight, setWeight] = useState("1");
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMessage(null);
    if (existingQuiz) {
      setTitle(existingQuiz.title);
      setPassMark(
        existingQuiz.pass_mark !== null ? String(existingQuiz.pass_mark) : ""
      );
      setMaxAttempts(
        existingQuiz.max_attempts !== null
          ? String(existingQuiz.max_attempts)
          : ""
      );
      setShuffleQuestions(existingQuiz.shuffle_questions);
      setWeight(String(existingQuiz.weight ?? 1));
      setQuestions(
        existingQuiz.questions.length > 0
          ? existingQuiz.questions.map((q) => ({
              id: q.id,
              prompt: q.prompt,
              options: q.options.length >= 2 ? [...q.options] : ["", ""],
              correct_index: q.correct_index,
              points: q.points,
            }))
          : [createEmptyQuestion()]
      );
    } else {
      setTitle(lessonId ? `${lessonTitle ?? "Lesson"} quiz` : "Final exam");
      setPassMark("");
      setMaxAttempts("");
      setShuffleQuestions(true);
      setWeight(lessonId ? "1" : "2");
      setQuestions([createEmptyQuestion()]);
    }
  }, [open, existingQuiz, lessonId, lessonTitle]);

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
    setErrorMessage(null);
  };

  const handleDeleteQuestion = (qIndex: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== qIndex));
    setErrorMessage(null);
  };

  const handleMoveQuestion = (qIndex: number, dir: "up" | "down") => {
    const target = dir === "up" ? qIndex - 1 : qIndex + 1;
    if (target < 0 || target >= questions.length) return;
    setQuestions((prev) => {
      const next = [...prev];
      const [moved] = next.splice(qIndex, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const handleQuestionField = (
    qIndex: number,
    patch: Partial<DraftQuestion>
  ) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, ...patch } : q))
    );
    setErrorMessage(null);
  };

  const handleOptionChange = (
    qIndex: number,
    optIndex: number,
    value: string
  ) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const nextOpts = [...q.options];
        nextOpts[optIndex] = value;
        return { ...q, options: nextOpts };
      })
    );
    setErrorMessage(null);
  };

  const handleAddOption = (qIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex || q.options.length >= 6) return q;
        return { ...q, options: [...q.options, ""] };
      })
    );
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex || q.options.length <= 2) return q;
        const nextOpts = q.options.filter((_, oi) => oi !== optIndex);
        let nextCorrect = q.correct_index;
        if (optIndex === q.correct_index) {
          nextCorrect = 0;
        } else if (optIndex < q.correct_index) {
          nextCorrect = q.correct_index - 1;
        }
        return { ...q, options: nextOpts, correct_index: nextCorrect };
      })
    );
  };

  const handleSave = () => {
    setErrorMessage(null);

    const payload = {
      id: existingQuiz?.id,
      track_id: trackId,
      lesson_id: lessonId,
      title,
      pass_mark: passMark.trim() === "" ? null : Number(passMark),
      max_attempts: maxAttempts.trim() === "" ? null : Number(maxAttempts),
      shuffle_questions: shuffleQuestions,
      weight: Number(weight),
      questions: questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options,
        correct_index: q.correct_index,
        points: Number(q.points),
      })),
    };

    const parsed = quizSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Please fix quiz errors.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    startTransition(async () => {
      const res = await adminSaveQuizAction(parsed.data);
      if (!res.ok) {
        setErrorMessage(res.error);
        toast.error(res.error);
        return;
      }

      toast.success(
        lessonId ? "Lesson quiz saved" : "Course final exam saved"
      );
      onOpenChange(false);
      onSaved();
      router.refresh();
    });
  };

  const handleDeleteQuiz = () => {
    if (!existingQuiz) return;
    startTransition(async () => {
      const res = await adminDeleteQuizAction(existingQuiz.id, trackId);
      if (!res.ok) {
        setErrorMessage(res.error);
        toast.error(res.error);
        return;
      }
      toast.success(lessonId ? "Quiz deleted" : "Final exam deleted");
      onOpenChange(false);
      onSaved();
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            {lessonId
              ? existingQuiz
                ? "Edit lesson quiz"
                : "Create lesson quiz"
              : existingQuiz
              ? "Edit final exam"
              : "Create final exam"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {lessonId
              ? `Quiz for ${lessonTitle ?? "this lesson"}.`
              : "Course-wide final exam required before learners earn a certificate."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {errorMessage && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400"
            >
              <AlertCircle className="h-4 w-4 shrink-0 stroke-[1.5]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quiz settings */}
          <div className="space-y-4 border-b border-border/60 pb-5">
            <div className="space-y-1.5">
              <Label htmlFor="quizTitle" className="text-xs font-medium">
                Quiz title
              </Label>
              <Input
                id="quizTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isPending}
                placeholder="e.g. Module 1 check"
                className="h-9 rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="quizPassMark" className="text-xs font-medium">
                  Pass mark (%)
                </Label>
                <Input
                  id="quizPassMark"
                  type="number"
                  min={1}
                  max={100}
                  value={passMark}
                  onChange={(e) => setPassMark(e.target.value)}
                  disabled={isPending}
                  placeholder={`Default (${defaultPassMark}%)`}
                  className="h-9 rounded-lg text-sm tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quizAttempts" className="text-xs font-medium">
                  Max attempts
                </Label>
                <Input
                  id="quizAttempts"
                  type="number"
                  min={1}
                  max={20}
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(e.target.value)}
                  disabled={isPending}
                  placeholder={`Default (${defaultMaxAttempts})`}
                  className="h-9 rounded-lg text-sm tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quizWeight" className="text-xs font-medium">
                  Weight
                </Label>
                <Input
                  id="quizWeight"
                  type="number"
                  step="0.5"
                  min={0.5}
                  max={100}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  disabled={isPending}
                  className="h-9 rounded-lg text-sm tabular-nums"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none pt-1">
              <Checkbox
                checked={shuffleQuestions}
                onCheckedChange={(checked) =>
                  setShuffleQuestions(Boolean(checked))
                }
                disabled={isPending}
              />
              <span>Shuffle question order for each attempt</span>
            </label>
          </div>

          {/* Questions list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">
                Questions ({questions.length})
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddQuestion}
                disabled={isPending}
                className="h-8 text-xs rounded-lg gap-1.5 border-border/70"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add question</span>
              </Button>
            </div>

            {questions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/80 p-6 text-center space-y-2">
                <HelpCircle className="h-6 w-6 text-muted-foreground mx-auto stroke-[1.5]" />
                <p className="text-xs text-muted-foreground">
                  No questions yet. Add at least one question before saving.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 border-t border-border/60">
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="py-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground tabular-nums">
                        Question {qIdx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={qIdx === 0 || isPending}
                          onClick={() => handleMoveQuestion(qIdx, "up")}
                          aria-label="Move question up"
                          className="h-7 w-7 p-0 rounded-lg"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={
                            qIdx === questions.length - 1 || isPending
                          }
                          onClick={() => handleMoveQuestion(qIdx, "down")}
                          aria-label="Move question down"
                          className="h-7 w-7 p-0 rounded-lg"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={questions.length <= 1 || isPending}
                          onClick={() => handleDeleteQuestion(qIdx)}
                          aria-label="Delete question"
                          className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_96px] gap-3 items-start">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Prompt
                        </Label>
                        <Textarea
                          rows={2}
                          value={q.prompt}
                          onChange={(e) =>
                            handleQuestionField(qIdx, {
                              prompt: e.target.value,
                            })
                          }
                          disabled={isPending}
                          placeholder="Ask a clear question..."
                          className="rounded-lg text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Points
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={q.points}
                          onChange={(e) =>
                            handleQuestionField(qIdx, {
                              points: Number(e.target.value),
                            })
                          }
                          disabled={isPending}
                          className="h-9 rounded-lg text-sm tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Options (select the correct answer)
                        </span>
                        {q.options.length < 6 && (
                          <button
                            type="button"
                            onClick={() => handleAddOption(qIdx)}
                            disabled={isPending}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            + Add option
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = q.correct_index === optIdx;
                          return (
                            <div
                              key={optIdx}
                              className="flex items-center gap-2"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuestionField(qIdx, {
                                    correct_index: optIdx,
                                  })
                                }
                                disabled={isPending}
                                aria-label={`Mark option ${optIdx + 1} as correct`}
                                className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border motion-safe:transition-colors duration-150",
                                  isCorrect
                                    ? "border-[var(--data-verified-border)] bg-[var(--data-verified-subtle)] text-[var(--data-verified-ink)]"
                                    : "border-border/70 bg-secondary/40 text-muted-foreground hover:text-foreground"
                                )}
                              >
                                <Check className="h-3.5 w-3.5 stroke-[2]" />
                              </button>
                              <Input
                                value={opt}
                                onChange={(e) =>
                                  handleOptionChange(
                                    qIdx,
                                    optIdx,
                                    e.target.value
                                  )
                                }
                                disabled={isPending}
                                placeholder={`Option ${optIdx + 1}`}
                                className="h-9 rounded-lg text-sm flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={q.options.length <= 2 || isPending}
                                onClick={() =>
                                  handleRemoveOption(qIdx, optIdx)
                                }
                                aria-label={`Remove option ${optIdx + 1}`}
                                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-3 border-t border-border/70">
          <div>
            {existingQuiz && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={handleDeleteQuiz}
                className="h-8 text-xs rounded-lg border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete quiz</span>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="h-8 text-xs rounded-lg border-border/70"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={handleSave}
              className="h-8 text-xs rounded-lg gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save quiz</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
