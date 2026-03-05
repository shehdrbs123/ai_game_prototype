// protected-midi.js (CommonJS)
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");

function b64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function hmacSha256(secret, data) {
  return crypto.createHmac("sha256", secret).update(data).digest();
}

function timingSafeEq(a, b) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

/**
 * createProtectedMidiRouter
 * @param {object} opts
 * @param {string|Buffer} opts.secret - HMAC secret (required)
 * @param {string} opts.rootDir - directory containing midi files (default: "<cwd>/private_assets")
 * @param {number} opts.ttlMs - token TTL in ms (default: 60000)
 * @param {(id:string)=>string} [opts.resolvePath] - map id -> absolute file path (optional)
 * @param {(req,res,next)=>void} [opts.auth] - auth middleware (optional)
 * @param {string} [opts.cacheControl] - Cache-Control header (default: "private, no-store")
 * @param {string} [opts.contentType] - Content-Type (default: "audio/midi")
 */
function createProtectedMidiRouter(opts) {
  if (!opts || !opts.secret) throw new Error("secret is required");
  const secret = opts.secret;
  const ttlMs = typeof opts.ttlMs === "number" ? opts.ttlMs : 60_000;
  const rootDir =
    opts.rootDir || path.join(process.cwd(), "private_assets");
  const auth = opts.auth || ((req, res, next) => next());
  const cacheControl = opts.cacheControl || "private, no-store";
  const contentType = opts.contentType || "audio/midi";

  const resolvePath =
    opts.resolvePath ||
    ((id) => path.join(rootDir, `${id}.mid`)); // 기본: <rootDir>/<id>.mid

  function signToken(id, exp) {
    const payload = `${id}.${exp}`;
    const sig = b64url(hmacSha256(secret, payload));
    return `${payload}.${sig}`;
  }

  function verifyToken(token, id) {
    if (!token) return { ok: false, code: 401 };
    const parts = String(token).split(".");
    if (parts.length !== 3) return { ok: false, code: 403 };

    const [tid, expStr, sig] = parts;
    if (tid !== id) return { ok: false, code: 403 };

    const exp = Number(expStr);
    if (!Number.isFinite(exp)) return { ok: false, code: 403 };
    if (Date.now() > exp) return { ok: false, code: 403 };

    const payload = `${tid}.${expStr}`;
    const expected = b64url(hmacSha256(secret, payload));
    if (!timingSafeEq(sig, expected)) return { ok: false, code: 403 };

    return { ok: true };
  }

  const router = express.Router();

  // 토큰 발급 (예: /midi/token/bgm)
  router.get("/token/:id", auth, (req, res) => {
    const id = req.params.id;
    const exp = Date.now() + ttlMs;
    res.json({ token: signToken(id, exp), exp });
  });

  // MIDI 제공 (예: /midi/asset/bgm?token=...)
  router.get("/asset/:id", auth, (req, res) => {
    const id = req.params.id;
    const { token } = req.query;

    const vr = verifyToken(token, id);
    if (!vr.ok) return res.status(vr.code).end();

    let filePath;
    try {
      filePath = resolvePath(id);
    } catch {
      return res.status(404).end();
    }

    if (!filePath || !fs.existsSync(filePath)) return res.status(404).end();

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", cacheControl);

    fs.createReadStream(filePath)
      .on("error", () => res.status(500).end())
      .pipe(res);
  });

  return router;
}

module.exports = { createProtectedMidiRouter };