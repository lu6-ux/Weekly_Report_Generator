"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import PasswordInput from "@/components/PasswordInput";
import { Alert } from "@/components/UI";
export default function RegisterPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");
    if (form.get("password") !== form.get("confirmPassword")) {
      setMessage("Passwords do not match. Please check both fields.");
      return;
    }
    setBusy(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      router.push("/login");
    } catch (error) {
      setMessage(errorMessage(error));
      setBusy(false);
    }
  }
  return (
    <AuthLayout>
      <div className="mb-7">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-indigo-600">
          Make room for progress
        </p>
        <h2 className="text-[28px] font-semibold tracking-tight">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Join your team and make your work visible.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label htmlFor="name">
          Full name
          <input
            id="name"
            name="name"
            required
            maxLength={100}
            autoComplete="name"
            placeholder="Your full name"
          />
        </label>
        <label htmlFor="email">
          Email address
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
          />
        </label>
        <div>
          <label htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            name="password"
            minLength={6}
            maxLength={72}
            required
            autoComplete="new-password"
            placeholder="Create a password"
          />
          <p className="mt-1.5 text-[11px] text-slate-400">
            Use at least 6 characters.
          </p>
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm password</label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            minLength={6}
            maxLength={72}
            required
            autoComplete="new-password"
            placeholder="Re-enter your password"
          />
        </div>
        {message && <Alert>{message}</Alert>}
        <button disabled={busy} className="btn w-full">
          {busy ? (
            <>
              <LoaderCircle size={16} className="animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          className="font-semibold text-indigo-600 hover:underline"
          href="/login"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
