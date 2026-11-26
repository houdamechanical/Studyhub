import rawIndex from "@/content/index.json";
import { isSubjectId, type SubjectId } from "@/lib/subjects";

export type ContentKind = "notes" | "quiz" | "interactive";

export type ContentItem = {
  id: string;
  title: string;
  subject: SubjectId;
  /** School half-year, e.g. "11.1" = Klasse 11, 1. Halbjahr */
  semester: string;
  topic: string;
  kind: ContentKind;
  tags: string[];
  /** Path relative to /content */
  file: string;
};

const items: ContentItem[] = (rawIndex as ContentItem[]).filter((item) => {
  if (!isSubjectId(item.subject)) {
    console.warn(`content/index.json: unknown subject "${item.subject}" for "${item.id}"`);
    return false;
  }
  return true;
});

export function getAllContent(): ContentItem[] {
  return items;
}

export function getContent(id: string): ContentItem | undefined {
  return items.find((item) => item.id === id);
}

export function getContentForSubject(subject: SubjectId): ContentItem[] {
  return items.filter((item) => item.subject === subject);
}

/** subject items grouped as semester → topic → items, newest semester first */
export function groupBySemesterAndTopic(list: ContentItem[]) {
  const semesters = new Map<string, Map<string, ContentItem[]>>();
  for (const item of list) {
    const topics = semesters.get(item.semester) ?? new Map<string, ContentItem[]>();
    const topicItems = topics.get(item.topic) ?? [];
    topicItems.push(item);
    topics.set(item.topic, topicItems);
    semesters.set(item.semester, topics);
  }
  return [...semesters.entries()]
    .sort(([a], [b]) => b.localeCompare(a, undefined, { numeric: true }))
    .map(([semester, topics]) => ({
      semester,
      topics: [...topics.entries()]
        .sort(([a], [b]) => a.localeCompare(b, "de"))
        .map(([topic, topicItems]) => ({ topic, items: topicItems })),
    }));
}
