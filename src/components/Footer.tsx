import { site } from "@/lib/site";

// Evaluated once at build time — stable for static prerendering (Next 16
// rejects `new Date()` calls made during render).
const YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p className="footer-name">{site.name}</p>
        <p className="footer-note">
          © {YEAR} {site.name} · Built in public, learning
          out loud.
        </p>
      </div>
    </footer>
  );
}
