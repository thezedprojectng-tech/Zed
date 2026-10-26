import type { Metadata } from "next";
import { NotFoundHero } from "@/components/site/NotFoundHero";
import { ClosingCTA } from "@/components/site/ClosingCTA";

export const metadata: Metadata = {
  title: "Page Not Found (404) | Zed",
  description: "The page you are looking for doesn't exist or has been moved.",
};

export default function Error404Page() {
  return (
    <>
      <NotFoundHero />
      <ClosingCTA />
    </>
  );
}
