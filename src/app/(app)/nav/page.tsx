import type { Metadata } from "next";
import passportFlow from "@/data/nav/passport.flow.json";
import nyscFlow from "@/data/nav/nysc.flow.json";
import ninBvnFlow from "@/data/nav/nin-bvn.flow.json";
import cacFlow from "@/data/nav/cac.flow.json";
import type { NavFlow } from "@/types/nav";
import { NavListClient } from "./NavListClient";

export const metadata: Metadata = {
  title: "Civic Guides – Zed Nav",
  description:
    "Interactive step-by-step guidance for Nigerian passport, NYSC, NIN-BVN, CAC registrations, call-up letter parsing, and CDS logging.",
};

const guides = [
  {
    flow: passportFlow as unknown as NavFlow,
    href: "/nav/passport",
    code: "NIS-01",
  },
  {
    flow: nyscFlow as unknown as NavFlow,
    href: "/nav/nysc",
    code: "NYSC-02",
  },
  {
    flow: ninBvnFlow as unknown as NavFlow,
    href: "/nav/nin-bvn",
    code: "NIMC-03",
  },
  {
    flow: cacFlow as unknown as NavFlow,
    href: "/nav/cac",
    code: "CAC-04",
  },
];

export default function NavPage() {
  return <NavListClient guides={guides} />;
}
