# Bharat Mitra AI conversational upgrade

## Goal
Keep the existing live merchant, shop, farm, and taxi search exactly as it is, while making every non-search message flow into a capable bilingual mentor conversation.

## Changes
- Leave `liveMerchantSearch.ts`, live-directory queries, ranking, and merchant cards unchanged.
- Upgrade the conversational server call to the current default Lovable AI chat model using the streaming Responses API.
- Preserve and resend the complete conversation history on every turn so advice and follow-up questions retain context.
- Refine the system guidance so greetings, business ideas, startup strategy, general knowledge, and casual chat receive natural Hindi or English answers without unsolicited shop recommendations or recurring sales pitches.
- Keep shop links/cards available only when the live-search path or an explicit shop request invokes them.
- Replace the current “thinking service busy” and empty-response copy with clear, non-promotional handling, while respecting gateway status rules and preserving the user’s message for retry.

## Technical details
- Stream every OpenAI Responses request with reasoning enabled, `store: false`, and encrypted reasoning continuity settings.
- Adapt the browser stream reader to the response event format while retaining markdown rendering and bilingual speech behavior.
- Return the gateway’s actual actionable message for terminal billing/policy failures; retry only rate limits and temporary server failures with bounded backoff.

## Verification
- Test a Hindi business-idea request and an English follow-up for natural, context-aware responses.
- Test greetings and general-knowledge questions to confirm no shop cards are injected.
- Regression-test an E-rickshaw/shop query to confirm the existing live cards, contact, WhatsApp, call, and priority ordering remain unchanged.
- Deploy and invoke the AI function, then confirm the preview has no build, runtime, or console errors.
