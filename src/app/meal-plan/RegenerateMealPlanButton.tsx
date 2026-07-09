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
        setMessage("A fresh meal plan is ready.");
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
        Regenerate meal plan
      </Button>
      {message ? <Notice tone={tone}>{message}</Notice> : null}
    </div>
  );
}
