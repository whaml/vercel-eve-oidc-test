export default function handler(req, res) {
  res.status(200).json({
    oidcToken: process.env.VERCEL_OIDC_TOKEN || "NOT_AVAILABLE_AT_RUNTIME",
    envVar: process.env.VERCEL_ENV || "NOT_SET"
  });
}
