import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AppShell } from "@/components/app/shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <AppShell
      user={{
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        genres: user.genres,
        moods: user.moods,
        preferredPlatform: user.preferredPlatform,
        onboardingCompleted: user.onboardingCompleted,
      }}
    >
      {children}
    </AppShell>
  );
}
