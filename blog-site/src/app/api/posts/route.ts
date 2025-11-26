import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { toGardenPost } from "@/lib/postFormatter";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      include: {
        author: { select: { name: true, avatarUrl: true } },
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json(posts.map(toGardenPost));
  } catch (error) {
    console.error("Error fetching posts", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

