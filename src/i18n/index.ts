import type { Phrase, Phrases } from "./types";
import { commonPhrases } from "./phrases/common";
import { authPhrases } from "./phrases/auth";
import { homePhrases } from "./phrases/home";
import { shopPhrases } from "./phrases/shop";
import { merchantPhrases } from "./phrases/merchant";
import { agentPhrases } from "./phrases/agent";
import { coordinatorPhrases } from "./phrases/coordinator";
import { goldenmerchantPhrases } from "./phrases/goldenmerchant";
import { adminPhrases } from "./phrases/admin";
import { ekycPhrases } from "./phrases/ekyc";
import { classifiedsPhrases } from "./phrases/classifieds";
import { matrimonyPhrases } from "./phrases/matrimony";
import { jobsPhrases } from "./phrases/jobs";
import { skillPhrases } from "./phrases/skill";
import { familyPhrases } from "./phrases/family";
import { chatbotPhrases } from "./phrases/chatbot";
import { customerPhrases } from "./phrases/customer";
import { miscPhrases } from "./phrases/misc";
import { nandaPhrases } from "./phrases/nanda";
import { kisanPhrases } from "./phrases/kisan";
import { servicesPhrases } from "./phrases/services";
import { legalPhrases } from "./phrases/legal";
import { profilePhrases } from "./phrases/profile";

const allPhrases: Phrases = [
  ...commonPhrases,
  ...authPhrases,
  ...homePhrases,
  ...shopPhrases,
  ...merchantPhrases,
  ...agentPhrases,
  ...coordinatorPhrases,
  ...goldenmerchantPhrases,
  ...adminPhrases,
  ...ekycPhrases,
  ...classifiedsPhrases,
  ...matrimonyPhrases,
  ...jobsPhrases,
  ...skillPhrases,
  ...familyPhrases,
  ...chatbotPhrases,
  ...customerPhrases,
  ...miscPhrases,
  ...nandaPhrases,
  ...kisanPhrases,
  ...servicesPhrases,
  ...legalPhrases,
  ...profilePhrases,
];

/** Lookup keyed by BOTH the english and the hindi source string. */
const lookup = new Map<string, Phrase>();
for (const pair of allPhrases) {
  const [en, hi] = pair;
  if (en && !lookup.has(en)) lookup.set(en, pair);
  if (hi && !lookup.has(hi)) lookup.set(hi, pair);
  // Common bilingual literal forms used across the app
  if (en && hi) {
    const combos = [`${en} / ${hi}`, `${hi} / ${en}`, `${en}/${hi}`, `${hi}/${en}`];
    for (const c of combos) if (!lookup.has(c)) lookup.set(c, pair);
  }
}

export const translatePhrase = (source: string, lang: "en" | "hi"): string | undefined => {
  const pair = lookup.get(source) ?? lookup.get(source.trim());
  if (!pair) return undefined;
  return (lang === "en" ? pair[0] : pair[1]) || source;
};

export type { Phrase, Phrases };
