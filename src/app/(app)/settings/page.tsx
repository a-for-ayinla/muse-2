import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { SettingsClient } from "@/components/app/settings-client";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser("/settings");
  return (
    <SettingsClient
      user={{
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        genres: user.genres,
        moods: user.moods,
        preferredPlatform: user.preferredPlatform,
      }}
    />
  );
}
