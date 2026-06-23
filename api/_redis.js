import { Redis } from "@upstash/redis";

// Vercel의 Upstash Redis(Marketplace) 연동을 추가하면
// KV_REST_API_URL / KV_REST_API_TOKEN 환경변수가 자동으로 주입됩니다.
export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export function userKey(nickname) {
  return `user:${nickname}`;
}

export function scrapKey(nickname) {
  return `scraps:${nickname}`;
}
