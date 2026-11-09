import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import WritingSection from "@/components/sections/WritingSection";
import SolarProjects from "@/components/SolarProjects";
import ExperienceSection from "@/components/sections/ExperienceSection";
import ConnectSection from "@/components/sections/ConnectSection";
import LeafTrail from "@/components/LeafTrail";

export default function Home() {
  return (
    <main>
      {/* Light-theme leaf cursor trail — free background only */}
      <LeafTrail />
      <Hero />
      <About />
      <WritingSection />
      <SolarProjects />
      <ExperienceSection />
      <ConnectSection />
    </main>
  );
}
