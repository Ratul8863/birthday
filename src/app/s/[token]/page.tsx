import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BirthdayExperience } from "@/components/birthday/BirthdayExperience";
import { birthdayConfig } from "@/lib/birthday-config";
import { getOrCreateExperience, getPublicConfig } from "@/lib/experience-service";

type PageProps = {
  params: Promise<{ token: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  return {
    title: `Happy Birthday, ${birthdayConfig.recipient.fullName ?? birthdayConfig.recipient.name}`,
    description: "A personal birthday surprise experience.",
    robots: { index: false, follow: false },
    other: { "x-experience-token": token },
  };
}

export default async function SurprisePage({ params }: PageProps) {
  const { token } = await params;

  if (!token || token === "demo" || token.length < 2) {
    redirect("/");
  }

  const config = getPublicConfig();
  const state = await getOrCreateExperience(token);

  return <BirthdayExperience token={token} initialConfig={config} initialState={state} />;
}
