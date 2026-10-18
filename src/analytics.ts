import { AnalyticsBrowser } from "@fernohq/analytics-next";

type Properties = Record<string, string | number | boolean>;

export type Screen =
  | "home"
  | "eligibility_checker"
  | "eligibility_results"
  | "report_checkout"
  | "sign_in"
  | "sign_up"
  | "exit_intent_survey";
export type EligibilityStepId =
  | "personal_information"
  | "education"
  | "experience"
  | "achievements"
  | "finances"
  | "goals";

export const eligibilitySteps: ReadonlyArray<{
  id: EligibilityStepId;
  name: string;
  number: number;
}> = [
  { id: "personal_information", name: "Personal information", number: 1 },
  { id: "education", name: "Education", number: 2 },
  { id: "experience", name: "Experience", number: 3 },
  { id: "achievements", name: "Achievements", number: 4 },
  { id: "finances", name: "Finances", number: 5 },
  { id: "goals", name: "Your goals", number: 6 },
];

const writeKey = import.meta.env.VITE_FERNO_API_WRITE_KEY
const sdk = writeKey
  ? AnalyticsBrowser.load(
      {
        writeKey,
        cdnSettings: {
          integrations: {
            "Segment.io": {
              apiKey: writeKey,
              apiHost: "data.useferno.com",
              apiPath: "/events",
              authMode: "bearer",
              retryQueue: true,
            },
          },
        },
      },
      { initialPageview: false },
    )
  : null;

function emit(
  kind: "screen" | "track" | "identify",
  name: string,
  properties?: Properties,
) {
  if (sdk) void sdk[kind](name, properties).catch((error: unknown) => console.error("[ferno] delivery failed", error));
  if (import.meta.env.DEV)
    console.info(`[ferno:${kind}] ${name}`, properties ?? {});
}

export const analytics = {
  page(screen: Screen, properties?: Properties) {
    emit("screen", screen, properties);
  },
  track(name: string, properties?: Properties) {
    emit("track", name, properties);
  },
  identify(userId: string) {
    emit("identify", userId);
  },
};

export function getDemoUserId() {
  const key = "verdis_demo_user_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = `demo_${crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
  localStorage.setItem(key, id);
  return id;
}
