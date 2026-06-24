import { requireRedis, userKey } from "./_redis.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "허용되지 않은 메서드입니다." });
      return;
    }

    const { nickname, password } = req.body || {};
    if (!nickname || !password) {
      res.status(400).json({ ok: false, error: "닉네임과 비밀번호를 입력해주세요." });
      return;
    }

    const trimmed = String(nickname).trim();
    const redis = requireRedis();
    const stored = await redis.get(userKey(trimmed));

    if (!stored || String(stored) !== String(password)) {
      res.status(401).json({ ok: false, error: "닉네임 또는 비밀번호가 일치하지 않습니다." });
      return;
    }

    res.status(200).json({ ok: true, nickname: trimmed });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      ok: false,
      error: err.message || "로그인 처리 중 오류가 발생했습니다.",
    });
  }
}
