import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Deletes an asset from Cloudinary (used when a post or image is removed).
 * Accepts a secure_url and derives the public_id from it.
 */
export async function POST(req: Request) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }

  const { url } = (await req.json()) as { url?: string };
  if (!url || !url.includes("/upload/")) {
    return NextResponse.json({ error: "bad-url" }, { status: 400 });
  }

  // https://res.cloudinary.com/{cloud}/image/upload/v123/folder/name.jpg
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?(?:\?|$)/i);
  if (!match) {
    return NextResponse.json({ error: "bad-url" }, { status: 400 });
  }
  const publicId = match[1];

  const timestamp = Math.round(Date.now() / 1000);
  const toSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  const form = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud}/image/destroy`,
    { method: "POST", body: form }
  );

  return NextResponse.json({ ok: res.ok });
}
