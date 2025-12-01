import { prisma } from "./prisma";

export function slugify(input: string) {
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (cleaned.length === 0) {
    return `post-${Date.now()}`;
  }

  return cleaned;
}

export async function ensureUniqueSlug(base: string, ignorePostId?: string) {
  let candidate = base;
  let suffix = 1;

  while (true) {
    const existing = await prisma.post.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === ignorePostId) {
      return candidate;
    }
    candidate = `${base}-${suffix++}`;
  }
}

