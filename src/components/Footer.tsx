"use client";

import { useSettings } from "@/lib/store";

export default function Footer() {
  const settings = useSettings();
  return (
    <footer className="site-footer">
      <p>{settings.footerLine}</p>
    </footer>
  );
}
