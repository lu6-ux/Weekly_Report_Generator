import {
  Layers3,
  ListChecks,
  MessageSquareText,
  History,
  Check,
  ArrowRight,
} from "lucide-react";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative flex flex-col justify-between bg-[#eef0fa] px-7 py-8 sm:px-12 lg:px-16 lg:py-12">
        <div className="flex items-center gap-3 text-lg font-bold tracking-tight text-indigo-950">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Layers3 size={23} />
          </span>
          Weekly Report System
        </div>
        <div className="max-w-lg py-10 lg:py-16">
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
            Better weeks start with clarity
          </p>
          <h1 className="text-3xl font-semibold leading-[1.25] tracking-tight text-slate-900 sm:text-[38px]">
            Track progress.
            <br />
            Review faster.
            <br />
            <span className="text-indigo-600">Work smarter.</span>
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-slate-600">
            A shared space for weekly updates, meaningful feedback, and a clear
            view of your team&apos;s progress.
          </p>
          <div className="mt-9 hidden space-y-5 sm:block">
            {[
              {
                icon: ListChecks,
                title: "Your week, in one place",
                text: "Capture tasks, achievements, and what comes next.",
              },
              {
                icon: MessageSquareText,
                title: "Feedback that moves work forward",
                text: "Review reports and turn comments into action.",
              },
              {
                icon: History,
                title: "Every update accounted for",
                text: "Follow progress with a complete version history.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white bg-white/70 text-indigo-600">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 hidden items-center gap-3 text-xs font-medium text-slate-500 lg:flex">
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-indigo-500" />
              Report
            </span>
            <ArrowRight size={13} />
            <span>Review</span>
            <ArrowRight size={13} />
            <span>Improve</span>
          </div>
        </div>
        <p className="hidden text-xs text-slate-500 lg:block">
          WeeklyFlow &middot; Built for productive teams
        </p>
      </section>
      <section className="flex items-center justify-center bg-white px-6 py-12 sm:px-12">
        <div className="w-full max-w-[380px]">
          {children}
          <p className="mt-10 text-center text-[11px] text-slate-400">
            A clearer view of your work. One week at a time.
          </p>
        </div>
      </section>
    </main>
  );
}
