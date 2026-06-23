import { redis, scrapKey } from "./_redis.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const nickname = String(req.query.nickname || "").trim();
    if (!nickname) {
      res.status(400).json({ ok: false, error: "닉네임이 필요합니다." });
      return;
    }
    const raw = await redis.get(scrapKey(nickname));
    let ids = [];
    if (raw) {
      try {
        ids = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        ids = [];
      }
    }
    res.status(200).json({ ok: true, articleIds: ids });
    return;
  }

  if (req.method === "POST") {
    const { nickname, articleIds } = req.body || {};
    const trimmed = String(nickname || "").trim();
    if (!trimmed || !Array.isArray(articleIds)) {
      res.status(400).json({ ok: false, error: "잘못된 요청입니다." });
      return;
    }
    await redis.set(scrapKey(trimmed), JSON.stringify(articleIds));
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ ok: false, error: "허용되지 않은 메서드입니다." });
}
