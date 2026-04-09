import type { ReactNode } from "react";

type ReportSectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  id?: string;
};

export function ReportSection({ title, subtitle, children, id }: ReportSectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[#888888]">{subtitle}</p> : null}
      </div>
      <div className="rounded-xl border border-[#222222] bg-[#111111] p-5 sm:p-6">{children}</div>
    </section>
  );
}
