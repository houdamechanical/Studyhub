import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentViewer } from "@/components/library/content-viewer";
import { getAllContent, getContent } from "@/lib/content";

type Props = { params: Promise<{ subject: string; id: string }> };

// One page per study page in content/index.json (static site).
export const dynamicParams = false;
export function generateStaticParams() {
  return getAllContent().map((item) => ({ subject: item.subject, id: item.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = getContent(id);
  return item ? { title: item.title } : {};
}

export default async function ContentViewerPage({ params }: Props) {
  const { subject, id } = await params;
  const item = getContent(id);
  if (!item || item.subject !== subject) notFound();
  return <ContentViewer item={item} />;
}
