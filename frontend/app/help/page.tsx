"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  CircleHelp,
  Files,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  PencilLine,
  ShieldCheck,
  Users,
} from "lucide-react";

const guideSections = [
  {
    icon: LayoutDashboard,
    title: "Getting Started",
    items: [
      "Log in with your email and password.",
      "Members land on the dashboard and managers land on the team dashboard.",
      "Use the left menu or the top actions to move between sections.",
    ],
  },
  {
    icon: Files,
    title: "Weekly Reports",
    items: [
      "Create a weekly report from the dashboard or the Create Report page.",
      "Add tasks, blockers, achievements, work hours, next-week plans, and notes.",
      "Save a draft while the report is still in DRAFT or NEEDS_CORRECTION state.",
      "Edit a report before it is submitted or returned for changes.",
      "Submit a report to send it to your manager for review.",
      "Open report details to review version history and manager feedback.",
    ],
  },
  {
    icon: FolderKanban,
    title: "Projects",
    items: [
      "Select a project when creating or updating a weekly report.",
      "Projects are managed from the manager project page.",
      "A project cannot be deleted if it has existing reports attached to it.",
    ],
  },
  {
    icon: MessageSquareText,
    title: "Reviews",
    items: [
      "Managers can review submitted weekly reports from the Team Dashboard.",
      "Managers can approve a report or request changes with a comment.",
      "Members can read feedback on the report details page and update the report.",
    ],
  },
  {
    icon: CircleHelp,
    title: "Dashboard and Statistics",
    items: [
      "The member dashboard summarizes total reports, drafts, submitted reports, and approved reports.",
      "Use the status filters to focus on a particular report stage.",
      "Manager dashboards include team status charts and work-hour breakdowns.",
    ],
  },
];

const memberSteps = [
  "Log in to the system.",
  "Open your dashboard from the navigation menu.",
  "Choose Create Report to start a new weekly update.",
  "Add project details, tasks, blockers, achievements, and work hours.",
  "Save your edits as a draft if you need more time.",
  "Review the full summary before submitting.",
  "Submit the report for manager review.",
  "Check the report details page for feedback and version history.",
  "Edit and resubmit the report if it needs changes.",
];

const managerSteps = [
  "Log in with your manager account.",
  "Open the Manager Dashboard to view submitted weekly reports.",
  "Filter by employee, project, status, or week.",
  "Open an individual report to review the detailed update.",
  "Use the review actions to approve the report or request changes.",
  "Add clear feedback when requesting corrections.",
  "Use the Projects page to maintain the project list used by team members.",
];

const adminItems = [
  "Admin users use the same role-protected endpoints and manager dashboard access patterns as managers.",
  "Admin features in this project are aligned with the manager workflow and project management actions.",
];

function SectionCard({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof LayoutDashboard;
  title: string;
  items: string[];
}) {
  return (
    <section className="card">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon size={18} strokeWidth={2} />
        </span>
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      </div>
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#f6f7fb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <div className="inline-flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
            <BookOpen size={16} />
            Help Center
          </div>
        </div>

        <header className="card mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <CircleHelp size={20} strokeWidth={2} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
                WeeklyFlow
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                How to Use the System
              </h1>
            </div>
          </div>
        </header>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Link href="/dashboard" className="card flex items-center justify-between gap-3 transition-colors hover:border-indigo-200">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <LayoutDashboard size={18} />
              </span>
              <span>
                <p className="text-sm font-semibold text-slate-800">Go to Dashboard</p>
                <p className="text-xs text-slate-500">View your weekly overview</p>
              </span>
            </div>
          </Link>

          <Link href="/reports/new" className="card flex items-center justify-between gap-3 transition-colors hover:border-indigo-200">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <PencilLine size={18} />
              </span>
              <span>
                <p className="text-sm font-semibold text-slate-800">Create a Report</p>
                <p className="text-xs text-slate-500">Start a weekly update</p>
              </span>
            </div>
          </Link>

          <Link href="/manager" className="card flex items-center justify-between gap-3 transition-colors hover:border-indigo-200">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Users size={18} />
              </span>
              <span>
                <p className="text-sm font-semibold text-slate-800">Manager Dashboard</p>
                <p className="text-xs text-slate-500">Review team reports</p>
              </span>
            </div>
          </Link>
        </div>

        <div className="mb-6 grid gap-5 lg:grid-cols-2">
          <section className="card">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <ShieldCheck size={18} strokeWidth={2} />
              </span>
              <h2 className="text-base font-semibold text-slate-800">Member Guide</h2>
            </div>
            <ol className="space-y-3">
              {memberSteps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="card">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <BriefcaseBusiness size={18} strokeWidth={2} />
              </span>
              <h2 className="text-base font-semibold text-slate-800">Manager Guide</h2>
            </div>
            <ol className="space-y-3">
              {managerSteps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="card mb-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <ListChecks size={18} strokeWidth={2} />
            </span>
            <h2 className="text-base font-semibold text-slate-800">Admin Guide</h2>
          </div>
          <ul className="space-y-3 text-sm leading-6 text-slate-600">
            {adminItems.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          {guideSections.map((section) => (
            <SectionCard key={section.title} {...section} />
          ))}
        </div>
      </div>
    </div>
  );
}
