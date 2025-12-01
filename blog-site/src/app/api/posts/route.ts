import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { toGardenPost } from "@/lib/postFormatter";
import { authOptions } from "@/lib/auth";
import { createPostSchema } from "@/lib/validators/postSchemas";
import { isAtLeastContributor } from "@/lib/roles";
import { ensureUniqueSlug, slugify } from "@/lib/slugify";

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

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !isAtLeastContributor(session.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createPostSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, slug, excerpt, contentMd, heroImageUrl, tagSlugs } = parsed.data;
  const userId = session.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "User session incomplete" }, { status: 400 });
  }

  const author = await prisma.author.findUnique({
    where: { userId },
  });

  if (!author) {
    return NextResponse.json(
      { error: "No author profile found for this user" },
      { status: 400 }
    );
  }

  const baseSlug = slug ? slugify(slug) : slugify(title);
  const uniqueSlug = await ensureUniqueSlug(baseSlug);

  let tagsToConnect: { tagId: string }[] = [];
  if (tagSlugs?.length) {
    const tags = await prisma.tag.findMany({
      where: { slug: { in: tagSlugs } },
    });
    const missing = tagSlugs.filter((t) => !tags.find((tag) => tag.slug === t));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Unknown tag(s): ${missing.join(", ")}` },
        { status: 400 }
      );
    }
    tagsToConnect = tags.map((tag) => ({ tagId: tag.id }));
  }

  try {
    const created = await prisma.post.create({
      data: {
        title,
        slug: uniqueSlug,
        excerpt,
        contentMd,
        heroImageUrl: heroImageUrl || null,
        status: "DRAFT",
        authorId: author.id,
        tags: tagsToConnect.length
          ? {
              createMany: {
                data: tagsToConnect,
              },
            }
          : undefined,
      },
      include: {
        author: { select: { name: true, avatarUrl: true } },
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json({ post: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating post", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}


