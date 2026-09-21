export type SpinnerMode = "random-unique" | "guaranteed" | "weighted";

export type GiftConfig = {
  id: string;
  label: string;
  shortLabel?: string;
  description?: string;
  imageSrc?: string;
  weight?: number;
  color: string;
};

export type BirthdayConfig = {
  recipient: {
    name: string;
    fullName?: string;
    nickname?: string;
    dearName?: string;
    birthday?: string;
    age?: number;
  };
  sender?: { name?: string; fullName?: string };
  hero: { eyebrow: string; title: string; subtitle: string };
  letter: { intro: string; body: string[]; signoff?: string };
  memories: Array<{
    id: string;
    src: string;
    alt: string;
    caption?: string;
  }>;
  specialCards: Array<{ title: string; text: string }>;
  balloons: {
    kicker: string;
    startHint: string;
    midHint: string;
    endHint: string;
    doneKicker: string;
    doneBody: string;
    cta: string;
  };
  audio: { trackSrc: string; initialVolume?: number };
  spinner: {
    maxSpins: number;
    mode: SpinnerMode;
    gifts: GiftConfig[];
    guaranteedGiftIds?: string[];
  };
  final: {
    headline: string;
    body: string[];
    closing: string;
  };
};

export type PublicGift = {
  id: string;
  label: string;
  shortLabel?: string;
  description?: string;
  imageSrc?: string;
  color: string;
};

export type ExperienceState = {
  token: string;
  maxSpins: number;
  spinCount: number;
  remainingSpins: number;
  wonGiftIds: string[];
  wonGifts: PublicGift[];
  completed: boolean;
  mode: SpinnerMode;
  note: string | null;
  noteSaved: boolean;
  noteChangesLeft: number;
  plan: { restaurant: string; time: string } | null;
};

export type ExperiencePhase =
  | "gate"
  | "reveal"
  | "story"
  | "cake"
  | "gifts"
  | "completed";

export type SpinState =
  | "idle"
  | "requesting"
  | "spinning"
  | "revealed"
  | "collecting";
