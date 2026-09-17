# Bharat Mitra Gemini primary chat

## Goal
Run Bharat Mitra’s general Hindi/English conversation through the owner’s Google Gemini API key, while leaving the existing live shop, service, farm, and transport search unchanged.

## Changes
- Store the Gemini key only in the secure backend secret store; never expose it in the website or Android app.
- Change only the conversational backend call from Lovable AI to Google Gemini’s streaming API.
- Keep full conversation history, the existing Bharat Mitra instructions, bilingual language switching, and streamed replies.
- Preserve the current live database search path, ranking, merchant cards, WhatsApp, call, and details actions without modification.
- Show Gemini’s real quota/rate-limit message when its free-tier allowance is exhausted; do not mislabel it as a Lovable credit error.

## Technical details
- After the key is saved, query Google’s available-model endpoint and select a supported non-preview Gemini Flash text model from that response.
- Call Gemini only from the backend function and stream its response to the existing chat interface.
- Apply bounded retry only to temporary rate-limit/server failures; other errors stop immediately and remain actionable.

## Verification
- Invoke the deployed chat with Hindi and English general/business questions and confirm complete streamed replies.
- Regression-test an E-rickshaw/shop query to confirm live cards still bypass the conversational AI call.
- Confirm no key appears in browser requests, project files, logs, or app storage.
