"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, errorMessage } from "@/lib/api";
import { User } from "@/lib/types";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Modal from "./Modal";
import { Alert, LoadingState } from "./UI";
export { StatusBadge } from "./UI";
const UserContext = createContext<User | null>(null);
export const useCurrentUser = () => useContext(UserContext);
export function Shell({
  title,
  subtitle,
  actions,
  children,
  managerOnly = false,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  managerOnly?: boolean;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [mobile, setMobile] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  useEffect(() => {
    api<{ user: User }>("/auth/me")
      .then(({ user }) => {
        if (managerOnly && user.role === "MEMBER") {
          router.replace("/dashboard");
          return;
        }
        setUser(user);
      })
      .catch((error) => {
        setMessage(errorMessage(error));
        router.replace("/login");
      });
  }, [managerOnly, router]);
  async function logout() {
    setBusy(true);
    try {
      await api("/auth/logout", { method: "POST" });
      router.replace("/login");
    } catch (error) {
      setMessage(errorMessage(error));
      setBusy(false);
    }
  }
  return (
    <UserContext.Provider value={user}>
      <div className="dashboard-shell">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <aside className="desktop-sidebar">
          <Sidebar user={user} logout={logout} busy={busy} />
        </aside>
        {mobile && (
          <Modal title="Navigation" onClose={() => setMobile(false)}>
            <Sidebar
              user={user}
              logout={logout}
              busy={busy}
              onNavigate={() => setMobile(false)}
            />
          </Modal>
        )}
        <div className="dashboard-body">
          <Topbar title={title} user={user} openMenu={() => setMobile(true)} />
          <main id="main-content" className="page-content">
            <div className="page-heading">
              <div>
                <h1>{title}</h1>
                {subtitle && (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
            {message && <Alert>{message}</Alert>}
            {user ? children : <LoadingState />}
          </main>
          <footer className="page-footer">
            <span>WeeklyFlow / Weekly Report System</span>
            <span>Make every week count.</span>
          </footer>
        </div>
      </div>
    </UserContext.Provider>
  );
}
