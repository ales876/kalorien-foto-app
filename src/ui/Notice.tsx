import type { ReactNode } from "react";

export type NoticeKind = "error" | "info" | "success";

export function Notice({
  kind = "error",
  children,
}: {
  kind?: NoticeKind;
  children: ReactNode;
}) {
  return (
    <div
      className={`notice notice-${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
