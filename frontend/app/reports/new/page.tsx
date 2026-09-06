"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ReportForm from "@/components/ReportForm";
import { api } from "@/lib/api";

export default function NewReportPage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    api<{ user: { role: string } }>('/auth/me')
      .then(({ user }) => {
        if (!active) return;
        if (user.role !== 'MEMBER') {
          router.replace('/manager');
        }
      })
      .catch(() => {
        if (!active) return;
        router.replace('/login');
      });

    return () => {
      active = false;
    };
  }, [router]);

  return <ReportForm />;
}
