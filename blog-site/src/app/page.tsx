import GardenExperience, { type GardenPost } from "@/components/GardenExperience";
import { prisma } from "@/lib/prisma";

const computeReadTime = (content: string) => {
  const words = content?.split(/\s+/).length || 0;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
};

const toGardenPost = (post: any): GardenPost => ({
  id: post.id,
  title: post.title,
  excerpt: post.excerpt ?? "",
  heroImageUrl: post.heroImageUrl ?? "",
  tags: post.tags.map((tag: any) => tag.tag.name),
  authorName: post.author?.name ?? "Unknown Gardener",
  authorAvatar: post.author?.avatarUrl ?? "",
  publishedAt: post.publishedAt ? post.publishedAt.toISOString() : "",
  readTime: computeReadTime(post.contentMd),
});

export default async function Home() {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: {
      author: { select: { name: true, avatarUrl: true } },
      tags: { include: { tag: true } },
    },
  });

  const gardenPosts =
    posts.length > 0
      ? posts.map(toGardenPost)
      : [
          {
            id: "placeholder-hero",
            title: "The Garden Awaits",
            excerpt:
              "Stories bloom soon—this is placeholder content until the first post sprouts from the soil.",
            heroImageUrl: "",
            tags: ["Coming Soon"],
            authorName: "Pedagogy Collective",
            authorAvatar: "",
            publishedAt: "",
            readTime: "Soon",
          },
        ];

  return <GardenExperience posts={gardenPosts} />;
}

