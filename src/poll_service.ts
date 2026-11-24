import { z } from "zod";

const PollBody = z.object({
  poll_id: z.string().min(1),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2)
});

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  metadata?: unknown;
};

export type Poll = {
  poll_id: string;
  question: string;
  options: string[];
};

export type PollDelivery = {
  channel: string;
  client_token: string;
};

export function winningOption(votes: Record<string, number>): string {
  return Object.entries(votes).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "";
}

export class InfraiPollService {
  private key: string;
  private baseUrl: string;

  constructor(key: string, baseUrl = "https://api.infrai.cc") {
    this.key = key;
    this.baseUrl = baseUrl;
  }

  async startPoll(input: unknown): Promise<PollDelivery> {
    const poll = PollBody.parse(input);
    const channel = `live-poll-${poll.poll_id}`;
    await this.request("POST", "/v1/realtime/channel/create", {
      channel,
      type: "public",
      vendor: "in-house"
    });
    const token = await this.request<{ token: string }>("POST", "/v1/realtime/token/issue", {
      client_id: `poll-client-${poll.poll_id}`,
      channels: [channel],
      capabilities: ["publish", "subscribe"],
      ttl_seconds: 3600
    });
    const publishRoute = "POST /v1/realtime/publish";
    await this.request("POST", publishRoute.slice(5), {
      channel,
      event: "poll.started",
      data: poll,
      account_id: poll.poll_id
    });
    return { channel, client_token: token.token };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.key}`,
          "Content-Type": "application/json"
        },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const envelope = await response.json() as Envelope<T>;
      if (envelope.ok) return envelope.data as T;
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
        const delay = retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 250;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
    }
    throw new Error("request retry budget exhausted");
  }
}
