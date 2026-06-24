import { Redis } from "@upstash/redis";

const hasRedisConfig = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// Vercel의 Upstash Redis(Marketplace) 연동을 추가하면
// KV_REST_API_URL / KV_REST_API_TOKEN 환경변수가 자동으로 주입됩니다.
export const redis = hasRedisConfig
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  : null;

export function requireRedis() {
  if (redis) return redis;
  const err = new Error("Vercel KV/Upstash Redis 환경 변수가 설정되어 있지 않습니다.");
  err.statusCode = 503;
  throw err;
}

export function userKey(nickname) {
  return `user:${nickname}`;
}

export function scrapKey(nickname) {
  return `scraps:${nickname}`;
}
