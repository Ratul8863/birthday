import type { Metadata } from "next";
import { BirthdayExperience } from "@/components/birthday/BirthdayExperience";
import { birthdayConfig } from "@/lib/birthday-config";
import { getOrCreateExperience, getPublicConfig } from "@/lib/experience-service";

const HOME_TOKEN = "home";

export const metadata: Metadata = {
  title: `Happy Birthday, ${birthdayConfig.recipient.fullName ?? birthdayConfig.recipient.name}`,
  description: "A personal birthday surprise experience.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const config = getPublicConfig();
  const state = await getOrCreateExperience(HOME_TOKEN);

  return <BirthdayExperience token={HOME_TOKEN} initialConfig={config} initialState={state} />;
}
