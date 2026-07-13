import type { ReactNode } from "react";

type NoticeTone = "info" | "warning" | "error" | "success";

type NoticeProps = {
  children: ReactNode;
  title?: string;
  tone?: NoticeTone;
};

const toneClassNames: Record<NoticeTone, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  error: "border-rose-200 bg-rose-50 text-rose-950",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
};

export function Notice({
  children,
  title,
  tone = "info",
}: NoticeProps) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${toneClassNames[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <div className="space-y-1">
        {title ? <p className="text-sm font-semibold">{title}</p> : null}
        <div className="text-sm leading-6">{children}</div>
      </div>
    </div>
  );
}
