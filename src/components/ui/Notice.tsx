import type { ReactNode } from "react";

type NoticeTone = "info" | "warning" | "error" | "success";

type NoticeProps = {
  children: ReactNode;
  title?: string;
  tone?: NoticeTone;
};

const toneClassNames: Record<NoticeTone, string> = {
  info: "border-[rgba(29,26,21,0.18)] bg-[#fffdf7] text-[var(--foreground)]",
  warning: "border-[#d5b46d] bg-[#fff2c8] text-[var(--foreground)]",
  error: "border-[#d98282] bg-[#ffe2dc] text-[var(--foreground)]",
  success: "border-[#91beb0] bg-[#e0f1e8] text-[var(--foreground)]",
};

export function Notice({
  children,
  title,
  tone = "info",
}: NoticeProps) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${toneClassNames[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <div className="space-y-1">
        {title ? <p className="text-sm font-semibold">{title}</p> : null}
        <div className="text-sm leading-6">{children}</div>
      </div>
    </div>
  );
}
