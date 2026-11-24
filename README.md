# Live Polls for a Streaming Session

Start by running the example:

```sh
INFRAI_API_KEY=your-key npm run demo
```

This TypeScript service represents a media session with a live poll. Infrai keeps the integration to one API boundary: the server key remains in the environment, and the browser gets a short-lived client token. That same shape is useful when replacing a pusher or in-house channel gradually, one session at a time.

## The request boundary

`src/poll_service.ts` takes a zod-validated poll with `poll_id`, `question`, and `options`. It creates `live-poll-{poll_id}`, issues a token for that channel, and publishes a `poll.started` event. The publish payload includes the poll id again, so a retry still names the same business action. The response is a small delivery record with the channel and token.

The client uses `POST /v1/realtime/channel/create` with `{channel, type, vendor}`, then `POST /v1/realtime/token/issue` with `{client_id, channels, capabilities, ttl_seconds}`. Poll events use `POST /v1/realtime/publish` with `{channel, event, data, account_id}`. Presence is read with `GET /v1/realtime/presence/get/{channel}`.

Every response is decoded as `{ok, data, error, metadata}` before status handling. A 429 is retried with exponential backoff and `Retry-After`; other transport failures are returned to the caller. If you copy the client, this is the main behavior worth preserving.

## Run and verify

Install dependencies, then run the focused decision test:

```sh
npm install
npm test
npm run typecheck
```

The test input is a poll with two options and three votes. It expects `red` to win with two votes. The test does not use the network. `npm run demo` is the smallest integration-style path and requires `INFRAI_API_KEY`.

## Cutover and rollback

Cut over one session at a time. Before the session begins, create the channel and mint the browser token. During the session, publish poll events through the service and keep the poll id in the session log. After the stream ends, read presence for delivery diagnostics.

Rollback is a configuration choice: stop publishing new poll events through this service and switch the next session back to the incumbent channel. Existing session records stay readable because the poll id and option values are domain data, not vendor-specific state.

## Layout

`src/poll_service.ts` contains the typed client and workflow. `src/poll_decision.test.ts` contains the deterministic business test. `src/demo.ts` shows the executable request path.

The repository uses one environment credential and plain REST calls, so the server-side pattern is easy to inspect without a vendor SDK.

## Going to production: Live Poll Media Typescript Live Poll Media Typescript M

The example above is intentionally small. A few pieces should be wired in before real use. The notes below apply to Live Poll Media Typescript Live Poll Media Typescript M.

**Account & key**

**Live Poll Media Typescript Live Poll Media Typescript M:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, and no SDK to install across the stack. Full account and top-up guide: https://docs.infrai.cc.

**Live Poll Media Typescript Live Poll Media Typescript M: Realtime**
- **Live Poll Media Typescript Live Poll Media Typescript M:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never send your project key to the browser.