import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import PostTable from "@/components/dashboard/PostTable";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAtLeastContributor } from "@/lib/roles";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !isAtLeastContributor(session.user?.role)) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      author: {
        select: {
          name: true,
        },
      },
    },
  });

  const formattedPosts = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    authorName: post.author?.name ?? "Unassigned",
    updatedAt: post.updatedAt ? post.updatedAt.toISOString() : "",
  }));

  return (
    <main className="min-h-screen bg-neutral-50 bg-[radial-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),radial-gradient(rgba(0,0,0,0.05)_1px,#fefefe_1px)] bg-[length:20px_20px]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-wide text-gray-500">Contributor Workspace</p>
          <h1 className="text-3xl font-bold text-gray-900">Editorial Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Review drafts, monitor publishing status, and manage upcoming posts.
          </p>
        </header>
        <PostTable
          posts={formattedPosts}
          currentUserName={session.user?.name ?? ""}
          currentUserRole={session.user?.role}
        />
      </div>
    </main>
  );
}

