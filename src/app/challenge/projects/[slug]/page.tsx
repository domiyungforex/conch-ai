import type { Metadata } from "next";
import { ProjectDetail } from "@/components/challenge/project-detail";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Project — ${slug} | Conch Creator Challenge`,
    description:
      "A project built with Conch's persistent memory and AI agent infrastructure.",
    openGraph: {
      title: `Project — ${slug} | Conch Creator Challenge`,
      description:
        "Built with Conch's persistent memory and AI agents.",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `Project — ${slug}`,
      description: "Built with Conch's persistent memory and AI agents.",
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  return <ProjectDetail slug={slug} />;
}
