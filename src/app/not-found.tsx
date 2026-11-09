import Link from "next/link";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="kicker">404</p>
      <h1>This page got lost in the archive.</h1>
      <p className="muted">
        The link you followed doesn&apos;t live here (yet). The blog is being
        built out — start again from the front page.
      </p>
      <Link className="btn-gold" href="/">
        ← Back to {site.firstName}&apos;s BlogSpace
      </Link>
    </main>
  );
}
