import type { Metadata } from "next";
import {
  Playfair_Display,
  Newsreader,
  Space_Grotesk,
  Fraunces,
  Inter,
  JetBrains_Mono,
  Lora,
  Caveat,
} from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveals from "@/components/ScrollReveals";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Newsreader({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const ui = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

/** Light theme swaps headings to Fraunces — same structure, new soul. */
const displayLight = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-light",
  display: "swap",
});

/* Extra faces for the post editor's font picker — Google Fonts (SIL OFL),
   self-hosted at build time via next/font: no runtime third-party requests. */
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });

/** Resolve the theme before first paint — no flash of wrong colours.
 *  Also arms scroll-reveal hidden states (only when motion is allowed). */
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('js-reveals')}}catch(e){}}try{var p=location.pathname;if(p==='/blogs'||p.indexOf('/blogs/')===0||p==='/dashboard')document.documentElement.dataset.page='blogs'}catch(e){}})()`;

export const metadata: Metadata = {
  title: {
    default: "Jash Shah — My BlogSpace",
    template: `%s — ${site.name}`,
  },
  description: site.description,
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${ui.variable} ${displayLight.variable} ${inter.variable} ${jetbrains.variable} ${lora.variable} ${caveat.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Header />
        {children}
        <Footer />
        {/* Scroll fade-ins (adds .in-view as blocks enter the viewport) */}
        <ScrollReveals />
      </body>
    </html>
  );
}
