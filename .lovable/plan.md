# Live Meeting / Zoom Webinar Suite

## Goal
Add a bilingual meeting area where registered users can schedule and host meetings, while guests join from a shared browser link without installing the app.

## User experience
- Add **Live Meeting / Zoom Webinar** beside Merchant Portal, Golden Merchant, and Help Desk in desktop and mobile menus.
- Add a meeting lobby where signed-in users can create a room with a title, date, and time, then copy or share its direct link on WhatsApp.
- Show upcoming and recent meetings created by the signed-in user, with Join, Share, End, and Delete actions.
- Add a public route such as `/meeting/:room-code`; guests enter their name and join without signing in.
- Derive signed-in participant labels such as Merchant, Agent, Coordinator, or User and include the role with their displayed meeting name.
- Embed a responsive Jitsi conference with grid view, active-speaker highlighting, microphone, camera, front/back camera selection, chat, screen sharing, participant list, and fullscreen controls.
- Give the room creator the host experience supported by Free Jitsi, including available participant moderation controls.
- Provide clear camera/microphone permission, invalid-room, ended-room, and connection-error states.

## Data and access
- Add a `meetings` table for room code, host, title, schedule, status, and timestamps.
- Allow authenticated users to create and manage only their own meetings.
- Allow public read access only for the limited room information needed by a valid guest link.
- Keep room creation and meeting management behind login; keep joining public.

## Technical details
- Load the official Jitsi External API only on meeting pages; no new app download is required for guests.
- Use a unique, non-guessable room name separate from the public room code.
- Configure the embedded toolbar for mic, camera, camera switching, chat, screen share, tile view, participant management, and hang-up.
- Synchronize app Hindi/English selection with meeting lobby and guest-join copy.
- Add the route, menu translations, semantic page metadata, and mobile-safe full-height conference layout.
- Preserve all existing Android authentication and login code.

## Verification
- Verify creation, saved scheduling, host-only management, public guest access, WhatsApp sharing, and ended-room blocking.
- Verify desktop and 360px mobile layouts, Jitsi loading, controls visibility, and no console/build errors.

## Free Jitsi limitation
Free public Jitsi supplies the conferencing controls, but guaranteed moderator ownership, forced mute, recording, custom tile UI, and service uptime are controlled by the public Jitsi service. The app will expose every moderation control Free Jitsi grants; guaranteed Zoom-style host authority would require a dedicated or managed Jitsi service later.
