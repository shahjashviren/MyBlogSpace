import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Signs a Cloudinary upload so the API secret never reaches the browser.
 * Returns 503 when env vars are missing → client silently falls back
 * to Firestore image records instead.
 *
 * GET exists purely so the owner can test configuration in a browser tab:
 *   http://localhost:3000/api/cloudinary-sign
 */
async function sign(folderFallback?: string) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "not-configured", hint: "Fill .env.local and restart the dev server" },
      { status: 503 }
    );
  }

  const folder = folderFallback && /^[A-Za-z0-9/_-]{1,60}$/.test(folderFallback)
    ? folderFallback
    : "jash-blog";

  const timestamp = Math.round(Date.now() / 1000);
  // Parameters must be sorted alphabetically before signing.
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  return NextResponse.json({ cloud, apiKey, timestamp, signature, folder });
}

export async function POST(req: Request) {
  let folder: string | undefined;
  try {
    const body = (await req.json()) as { folder?: string };
    folder = body?.folder;
  } catch {
    /* no body — default folder */
  }
  return sign(folder);
}

export async function GET() {
  return sign();
}
