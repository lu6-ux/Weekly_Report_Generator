"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Files,
  SquarePen,
  Users,
  FolderKanban,
  LogOut,
  Layers3,
  ArrowUpRight,
} from "lucide-react";
import { User, label } from "@/lib/types";
import { Avatar } from "./UI";
export function Brand() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2.5 text-lg font-bold tracking-tight"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
        <Layers3 size={21} />
      </span>
      WeeklyFlow<span className="sr-only">Weekly Reports</span>
    </Link>
  );
}
export default function Sidebar({
  user,
  logout,
  busy,
  onNavigate,
}: {
  user: User | null;
  logout: () => void;
  busy: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const memberLinks = [
    { href: "/dashboard", title: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard#my-reports", title: "My Reports", icon: Files },
    { href: "/reports/new", title: "Create Report", icon: SquarePen },
  ];
  const managerLinks = [
    { href: "/manager", title: "Manager Dashboard", icon: Users },
    { href: "/manager/projects", title: "Projects", icon: FolderKanban },
  ];
  const links = user && user.role !== "MEMBER" ? managerLinks : memberLinks;
  const team = [
    { href: "/manager", title: "Manager Dashboard", icon: Users },
    { href: "/manager/projects", title: "Projects", icon: FolderKanban },
  ];
  function nav(items: typeof memberLinks) {
    return items.map(({ href, title, icon: Icon }) => (
      <Link
        key={href}
        href={href}
        onClick={onNavigate}
        aria-current={pathname === href ? "page" : undefined}
        className={`nav-link ${pathname === href ? "nav-active" : ""}`}
      >
        <Icon size={18} strokeWidth={1.7} />
        {title}
        {pathname === href && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
        )}
      </Link>
    ));
  }
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-8 pt-7">
        <Brand />
      </div>
      <nav aria-label="Main navigation" className="space-y-7 px-3">
        <div>
          <p className="nav-label">Workspace</p>
          <div className="mt-2 space-y-1">{nav(links)}</div>
        </div>
        {user && user.role !== "MEMBER" && (
          <div>
            <p className="nav-label">Team management</p>
            <div className="mt-2 space-y-1">{nav(team)}</div>
          </div>
        )}
      </nav>
      <div className="mt-auto p-4">
        <div className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
          <p className="text-xs font-semibold text-indigo-900">
            A little clarity, every week.
          </p>
          <p className="mt-2 text-xs leading-5 text-indigo-700">
            Turn your weekly work into meaningful progress.
          </p>
          <Link
            onClick={onNavigate}
            href="/reports/new"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700"
          >
            Write a report <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name || "User"} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {user?.name || "Your workspace"}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {user ? label(user.role) : "Connecting..."}
              </p>
            </div>
          </div>
          <button
            disabled={busy}
            onClick={logout}
            className="nav-link mt-3 w-full"
          >
            <LogOut size={17} />
            {busy ? "Signing out..." : "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
}
