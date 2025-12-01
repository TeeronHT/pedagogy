import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { updatePostSchema } from "@/lib/validators/postSchemas";
import { isAdmin, isAtLeastContributor, isAtLeastEditor } from "@/lib/roles";
import { ensureUniqueSlug, slugify } from "@/lib/slugify";

type RouteContext = {
  params: Promise<{ postId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { postId } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session || !isAtLeastContributor(session.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { author: { select: { userId: true } }, tags: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const userId = session.user?.id;
  const userRole = session.user?.role;
  const isOwner = userId ? post.author?.userId === userId : false;
  const canEdit = isAdmin(userRole) || isAtLeastEditor(userRole) || isOwner;

  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = updatePostSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tagSlugs, status, heroImageUrl, slug, ...rest } = parsed.data;
  const data: any = { ...rest };

  if (slug) {
    const candidate = slugify(slug);
    data.slug = await ensureUniqueSlug(candidate, post.id);
  }

  if (status) {
    if (status === "PUBLISHED") {
      data.status = "PUBLISHED";
      data.publishedAt = rest.publishedAt ? new Date(rest.publishedAt) : new Date();
    } else {
      data.status = status;
      data.publishedAt = status === "DRAFT" ? null : post.publishedAt;
    }
  }

  if (heroImageUrl !== undefined) {
    data.heroImageUrl = heroImageUrl || null;
  }

  if (tagSlugs) {
    const tags = await prisma.tag.findMany({ where: { slug: { in: tagSlugs } } });
    const missing = tagSlugs.filter((slug) => !tags.find((tag) => tag.slug === slug));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Unknown tag(s): ${missing.join(", ")}` },
        { status: 400 }
      );
    }
    data.tags = {
      deleteMany: {},
      createMany: { data: tags.map((tag) => ({ tagId: tag.id })) },
    };
  }

  try {
    const updated = await prisma.post.update({
      where: { id: post.id },
      data,
      include: {
        author: { select: { name: true, avatarUrl: true } },
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error("Error updating post", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}


export async function DELETE(_request: Request, context: RouteContext) {
  const { postId } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.post.delete({
      where: { id: postId },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting post", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}

