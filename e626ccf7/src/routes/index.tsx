import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/nextnab/PageShell";
import { HeroSection } from "@/components/nextnab/HeroSection";
import { MarqueeStrip } from "@/components/nextnab/MarqueeStrip";
import { CategorySection } from "@/components/nextnab/CategorySection";
import { HowItWorks } from "@/components/nextnab/HowItWorks";

const title = "NextNab — 20-min grocery delivery & trusted home services in Latur";
const description =
  "From fresh groceries to reliable plumbers. NextNab connects you to Latur's best local providers instantly.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <PageShell>
      <HeroSection />
      <MarqueeStrip />
      <CategorySection />
      <HowItWorks />
    </PageShell>
  );
}
