import { redis, userKey, scrapKey } from "./_redis.js";

function isValidNickname(s) {
  return typeof s === "string" && s.trim().length >= 1 && s.trim().length <= 20;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "허용되지 않은 메서드입니다." });
    return;
  }

  const { nickname, password } = req.body || {};

  if (!isValidNickname(nickname) || !password || String(password).length < 1) {
    res.status(400).json({ ok: false, error: "닉네임과 비밀번호를 입력해주세요." });
    return;
  }

  const trimmed = nickname.trim();
  const key = userKey(trimmed);

  const existing = await redis.get(key);
  if (existing) {
    res.status(409).json({ ok: false, error: "이미 사용 중인 닉네임입니다." });
    return;
  }

  await redis.set(key, String(password));
  await redis.set(scrapKey(trimmed), JSON.stringify([]));

  res.status(200).json({ ok: true, nickname: trimmed });
}
