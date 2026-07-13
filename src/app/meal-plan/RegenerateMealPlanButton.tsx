"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { regenerateMealPlan } from "@/app/actions/recommendations";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";

export function RegenerateMealPlanButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"success" | "error">("success");

  function handleClick() {
    setMessage(null);

    startTransition(async () => {
      const result = await regenerateMealPlan();

      if (result.ok) {
        setTone("success");
        setMessage("새 식단표가 준비되었습니다.");
        router.refresh();
        return;
      }

      setTone("error");
      setMessage(result.message);
    });
  }

  return (
    <div className="space-y-3">
      <Button pending={isPending} onClick={handleClick}>
        식단표 새로 만들기
      </Button>
      {message ? <Notice tone={tone}>{message}</Notice> : null}
    </div>
  );
}
