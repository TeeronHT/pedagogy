import type { GardenPost } from "@/components/GardenExperience";

export const computeReadTime = (content: string) => {
  const words = content?.split(/\s+/).length || 0;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
};

export const toGardenPost = (post: any): GardenPost => ({
  id: post.id,
  title: post.title,
  excerpt: post.excerpt ?? "",
  heroImageUrl: post.heroImageUrl ?? "",
  slug: post.slug,
  tags: post.tags.map((tag: any) => tag.tag.name),
  authorName: post.author?.name ?? "Unknown Gardener",
  authorAvatar: post.author?.avatarUrl ?? "",
  publishedAt: post.publishedAt ? post.publishedAt.toISOString() : "",
  readTime: computeReadTime(post.contentMd),
});

