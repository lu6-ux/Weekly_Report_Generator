"use client";
import { Menu, ChevronRight } from "lucide-react";
import { User, label } from "@/lib/types";
import { Avatar } from "./UI";
export default function Topbar({
  title,
  user,
  openMenu,
}: {
  title: string;
  user: User | null;
  openMenu: () => void;
}) {
  return (
    <header className="topbar">
      <div className="flex min-w-0 items-center gap-3">
        <button
          className="icon-button lg:hidden"
          aria-label="Open navigation"
          onClick={openMenu}
        >
          <Menu size={20} />
        </button>
        <span className="hidden text-sm text-slate-400 sm:inline">
          Workspace
        </span>
        <ChevronRight size={14} className="hidden text-slate-300 sm:block" />
        <span className="truncate text-sm font-medium text-slate-700">
          {title}
        </span>
      </div>
      {user && (
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold">{user.name}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {label(user.role)} account
            </p>
          </div>
          <Avatar name={user.name} small />
        </div>
      )}
    </header>
  );
}
