import { HeroSection } from "@/components/sections/HeroSection";
import { MediaSection } from "@/components/sections/MediaSection";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { SolutionSection } from "@/components/sections/SolutionSection";
import { DemoSection } from "@/components/sections/DemoSection";
import { FoundersSection } from "@/components/sections/FoundersSection";
import { OrionNavbar } from "@/components/OrionNavbar";
import { OrionFooter } from "@/components/OrionFooter";

const Index = () => {
  return (
    <div className="min-h-screen">
      <OrionNavbar />
      <main>
        <HeroSection />
        <MediaSection />
        <ProblemSection />
        <SolutionSection />
        <DemoSection />
        <FoundersSection />
      </main>
      <OrionFooter />
    </div>
  );
};

export default Index;
