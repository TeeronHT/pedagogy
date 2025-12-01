import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function resetDatabase() {
  await prisma.$transaction([
    prisma.postTag.deleteMany(),
    prisma.media.deleteMany(),
    prisma.post.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.author.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

type UserRole = "CONTRIBUTOR" | "EDITOR" | "ADMIN";
type PostStatus = "DRAFT" | "REVIEW" | "PUBLISHED";

async function createUserWithAuthor(opts: {
  email: string;
  role: UserRole;
  name: string;
  bio?: string;
  avatarUrl?: string;
  passwordHash: string;
}) {
  const result = await prisma.user.create({
    data: {
      email: opts.email,
      passwordHash: opts.passwordHash,
      role: opts.role,
      author: {
        create: {
          name: opts.name,
          bio: opts.bio,
          avatarUrl: opts.avatarUrl,
        },
      },
    },
    include: { author: true },
  });

  if (!result.author) {
    throw new Error(`Failed to create author profile for ${opts.email}`);
  }

  return { userId: result.id, authorId: result.author.id };
}

async function main() {
  await resetDatabase();

  const passwordHash = await bcrypt.hash("password123", 12);

  const alice = await createUserWithAuthor({
    email: "alice@example.com",
    role: "ADMIN",
    name: "Alice Johnson",
    bio: "Gardener • Writer • Systems thinker.",
    avatarUrl: "https://i.pravatar.cc/150?img=1",
    passwordHash,
  });

  const bob = await createUserWithAuthor({
    email: "bob@example.com",
    role: "CONTRIBUTOR",
    name: "Bob Smith",
    bio: "Developer documenting the gardener's journey.",
    avatarUrl: "https://i.pravatar.cc/150?img=2",
    passwordHash,
  });

  await prisma.tag.createMany({
    data: [
      { name: "Philosophy", slug: "philosophy" },
      { name: "Frontend", slug: "frontend" },
      { name: "Finance", slug: "finance" },
      { name: "Garden Logs", slug: "garden-logs" },
    ],
    skipDuplicates: true,
  });

  const tagsBySlug = (await prisma.tag.findMany()).reduce<Record<string, string>>(
    (acc, tag) => {
      acc[tag.slug] = tag.id;
      return acc;
    },
    {}
  );

  const alicePost = await prisma.post.create({
    data: {
      title: "The Paradox of Choice in Modern AI Tools",
      slug: "paradox-of-choice-ai",
      excerpt:
        "How endless AI tooling can slow creativity and why curation matters.",
      contentMd: "# Garden Reflections\n\nLots of words...",
      heroImageUrl:
        "https://images.unsplash.com/photo-1596556555198-d10a266a2b75?auto=format&fit=crop&w=2000&q=80",
      status: "PUBLISHED",
      publishedAt: new Date("2023-11-20T10:00:00Z"),
      authorId: alice.authorId,
    },
  });

  const bobPost = await prisma.post.create({
    data: {
      title: "The Subtle Art of Long-Term Value Investing",
      slug: "value-investing-art",
      excerpt:
        "Applying Buffett-inspired principles to volatile, modern markets.",
      contentMd: "## Value Investing\n\nNotes and strategies...",
      heroImageUrl:
        "https://images.unsplash.com/photo-1621839675685-61845f32b85c?auto=format&fit=crop&w=2000&q=80",
      status: "PUBLISHED",
      publishedAt: new Date("2023-11-18T14:30:00Z"),
      authorId: bob.authorId,
    },
  });

  await prisma.postTag.createMany({
    data: [
      { postId: alicePost.id, tagId: tagsBySlug["philosophy"] },
      { postId: alicePost.id, tagId: tagsBySlug["frontend"] },
      { postId: bobPost.id, tagId: tagsBySlug["finance"] },
    ].filter(
      (entry): entry is { postId: string; tagId: string } =>
        Boolean(entry.postId && entry.tagId)
    ),
  });

  console.log("Database seeded successfully ✅");
}

main()
  .catch((error) => {
    console.error("Seed failed ❌", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

