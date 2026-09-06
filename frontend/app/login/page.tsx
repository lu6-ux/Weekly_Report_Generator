"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleHelp, LoaderCircle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import PasswordInput from "@/components/PasswordInput";
import { Alert } from "@/components/UI";
import { api } from "@/lib/api";
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const data = await api<{
        user: { role: string };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.push(
        data.user.role === "MANAGER" || data.user.role === "ADMIN"
          ? "/manager"
          : "/dashboard",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed");
      setLoading(false);
    }
  }
  return (
    <AuthLayout>
      <div className="mb-8">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-indigo-600">
          Your workspace awaits
        </p>
        <h2 className="text-[28px] font-semibold tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Sign in to stay connected with your team.
        </p>
      </div>
      <form onSubmit={handleLogin} className="space-y-5">
        <label htmlFor="email">
          Email address
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <div>
          <label htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {message && <Alert>{message}</Alert>}
        <button disabled={loading} className="btn mt-1 w-full">
          {loading ? (
            <>
              <LoaderCircle size={16} className="animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Login
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
      <div className="mt-6 flex flex-col items-center gap-3 text-center text-sm text-slate-500">
        <Link
          href="/help"
          aria-label="How to use this system"
          className="inline-flex items-center gap-2 font-semibold text-indigo-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <CircleHelp size={16} />
          How to Use / Read Me
        </Link>
        <p>
          New to WeeklyFlow?{" "}
          <Link
            href="/register"
            className="font-semibold text-indigo-600 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
