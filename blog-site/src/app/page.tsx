import GardenExperience from "@/components/GardenExperience";
import { prisma } from "@/lib/prisma";
import { toGardenPost } from "@/lib/postFormatter";

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

