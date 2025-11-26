import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        posts: {
          select: {
            post: {
              select: { status: true },
            },
          },
        },
      },
    });

    const payload = tags.map((tag) => {
      const publishedCount = tag.posts.filter((entry) => entry.post.status === "PUBLISHED").length;
      return {
        tag: tag.name,
        slug: tag.slug,
        count: publishedCount,
      };
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error fetching tags", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

