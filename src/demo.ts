import { InfraiPollService } from "./poll_service.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");

const service = new InfraiPollService(key);
const delivery = await service.startPoll({
  poll_id: "stream-2026-10-25",
  question: "Which segment should we review next?",
  options: ["clinical", "creator"]
});
console.log(JSON.stringify(delivery, null, 2));
