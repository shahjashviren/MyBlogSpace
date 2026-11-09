"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useExperience, usePosts, useProjects } from "@/lib/store";
import PostsPanel from "@/components/dashboard/PostsPanel";
import ProjectsPanel from "@/components/dashboard/ProjectsPanel";
import ExperiencePanel from "@/components/dashboard/ExperiencePanel";
import PhotosPanel from "@/components/dashboard/PhotosPanel";
import SiteContentPanel from "@/components/dashboard/SiteContentPanel";

type Tab = "overview" | "posts" | "projects" | "experience" | "photos" | "site";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "posts", label: "Posts" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "photos", label: "Hero photos" },
  { id: "site", label: "Site Content" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return auth.onAuthStateChanged((u) => {
      // An anonymous session (commenter identity) is NOT the owner — Firestore
      // rules deny it every write, so never let it into the dashboard.
      if (u && !u.isAnonymous) {
        setReady(true);
      } else {
        if (u) void signOut(auth);
        router.replace("/login");
      }
    });
  }, [router]);

  if (!ready) {
    return (
      <main className="dash-page">
        <p className="muted dash-loading">Checking credentials…</p>
      </main>
    );
  }

  // Only mount the data hooks once auth is confirmed: owner queries are
  // unfiltered, and Firestore rules deny them for signed-out visitors.
  return <DashboardBody />;
}

function DashboardBody() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");

  const { posts, reload: reloadPosts } = usePosts("owner");
  const { items: projects, reload: reloadProjects } = useProjects(true);
  const { items: xp, reload: reloadXp } = useExperience(true);

  return (
    <main className="dash-page">
      <header className="dash-top">
        <div>
          <p className="kicker">Owner dashboard</p>
          <h1>Control room</h1>
        </div>
        <div className="dash-actions">
          <Link className="btn-ghost" href="/">
            View site ↗
          </Link>
          <button
            type="button"
            className="btn-ghost"
            onClick={async () => {
              await signOut(auth);
              router.replace("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <nav className="dash-tabs" aria-label="Dashboard sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "is-on" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="dash-body">
        {tab === "overview" && (
          <section className="dash-overview">
            <div className="stat-grid">
              <div className="stat glass">
                <strong>{posts.length}</strong>
                <span>Posts</span>
              </div>
              <div className="stat glass">
                <strong>{projects.length}</strong>
                <span>Projects</span>
              </div>
              <div className="stat glass">
                <strong>{xp.length}</strong>
                <span>Experience</span>
              </div>
            </div>
            <div className="dash-help glass">
              <h2>How this works</h2>
              <ol>
                <li>
                  Create content here — it appears on the public site
                  <em> instantly</em> (no deploy needed).
                </li>
                <li>
                  Post images and thumbnails are compressed in your browser
                  before storage — everything stays on the free plan.
                </li>
                <li>
                  First time? Head to <strong>Posts</strong> or{' '}
                  <strong>Projects</strong> and press New to create your
                  first entry.
                </li>
              </ol>
            </div>
          </section>
        )}

        {tab === "posts" && <PostsPanel items={posts} onChanged={reloadPosts} />}
        {tab === "projects" && <ProjectsPanel items={projects} onChanged={reloadProjects} />}
        {tab === "experience" && <ExperiencePanel items={xp} onChanged={reloadXp} />}
        {tab === "photos" && <PhotosPanel />}
        {tab === "site" && <SiteContentPanel />}
      </div>
    </main>
  );
}
