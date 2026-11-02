import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import WritingSection from "@/components/sections/WritingSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import ExperienceSection from "@/components/sections/ExperienceSection";
import ConnectSection from "@/components/sections/ConnectSection";

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <WritingSection />
      <ProjectsSection />
      <ExperienceSection />
      <ConnectSection />
    </main>
  );
}
