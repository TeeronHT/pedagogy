"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  isAdmin,
  isAtLeastContributor,
  isAtLeastEditor,
  type UserRole,
} from "@/lib/roles";

type DashboardPost = {
  id: string;
  title: string;
  slug: string;
  status: string;
  authorName: string;
  updatedAt: string;
};

const statusOptions = ["ALL", "DRAFT", "REVIEW", "PUBLISHED"] as const;

const statusStyles: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  REVIEW: "bg-blue-100 text-blue-800",
  PUBLISHED: "bg-green-100 text-green-800",
};

const formatDate = (value: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

type SortKey = "updatedAt" | "title" | "status";

export default function PostTable({
  posts,
  currentUserName,
  currentUserRole,
}: {
  posts: DashboardPost[];
  currentUserName?: string;
  currentUserRole?: UserRole;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("ALL");
  const authorOptions = useMemo(() => {
    const unique = Array.from(new Set(posts.map((post) => post.authorName || "Unassigned")));
    return ["ALL", ...unique];
  }, [posts]);
  const [authorFilter, setAuthorFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isEditingId, setIsEditingId] = useState<string | null>(null);
  const [newPostModalOpen, setNewPostModalOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostSlug, setNewPostSlug] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (statusFilter !== "ALL") {
      result = result.filter((post) => post.status === statusFilter);
    }
    if (authorFilter !== "ALL") {
      result = result.filter((post) => post.authorName === authorFilter);
    }
    const sorted = [...result];
    sorted.sort((a, b) => {
      if (sortKey === "updatedAt") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortKey === "title") {
        return a.title.localeCompare(b.title);
      }
      return a.status.localeCompare(b.status);
    });
    return sorted;
  }, [posts, statusFilter, authorFilter, sortKey]);

  const canCreate = isAtLeastContributor(currentUserRole);
  const canPublish = isAtLeastEditor(currentUserRole);
  const canDelete = isAdmin(currentUserRole);

  const resetNewPostForm = () => {
    setNewPostTitle("");
    setNewPostSlug("");
    setNewPostContent("");
  };

  const refreshData = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleCreatePost = async () => {
    if (!newPostTitle || !newPostContent) {
      setMessage("Title and content are required.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPostTitle,
          slug: newPostSlug || undefined,
          contentMd: newPostContent,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create post");
      }
      resetNewPostForm();
      setNewPostModalOpen(false);
      refreshData();
    } catch (error: any) {
      setMessage(error.message ?? "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!canDelete) return;
    setIsDeletingId(postId);
    setMessage(null);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete post");
      }
      refreshData();
    } catch (error: any) {
      setMessage(error.message ?? "Failed to delete post");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleStatusUpdate = async (postId: string, status: string) => {
    setIsEditingId(postId);
    setMessage(null);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update post");
      }
      refreshData();
    } catch (error: any) {
      setMessage(error.message ?? "Failed to update post");
    } finally {
      setIsEditingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Filters
            </h2>
            <div className="mt-3 flex flex-wrap gap-4">
              <div className="flex flex-col text-sm">
                <label className="mb-1 text-gray-500">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as (typeof statusOptions)[number])}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status === "ALL" ? "All statuses" : status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col text-sm">
                <label className="mb-1 text-gray-500">Author</label>
                <select
                  value={authorFilter}
                  onChange={(e) => setAuthorFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                >
                  {authorOptions.map((author) => (
                    <option key={author} value={author}>
                      {author === "ALL" ? "All authors" : author}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col text-sm">
                <label className="mb-1 text-gray-500">Sort by</label>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                >
                  <option value="updatedAt">Last Updated</option>
                  <option value="title">Title</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 text-sm text-gray-600">
            <span>
              Signed in as <span className="font-semibold text-gray-900">{currentUserName ?? "Unknown"}</span>
            </span>
            <span className="text-xs uppercase tracking-wide text-gray-500">
              Role: {currentUserRole ?? "N/A"}
            </span>
            <button
              disabled={!canCreate}
              onClick={() => setNewPostModalOpen(true)}
              className={`mt-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                canCreate
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "cursor-not-allowed bg-gray-200 text-gray-500"
              }`}
            >
              New Post
            </button>
          </div>
        </div>
      </section>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Last Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPosts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No posts match the current filters.
                </td>
              </tr>
            ) : (
              filteredPosts.map((post) => {
                const isAssignedToCurrentUser =
                  !!currentUserName &&
                  post.authorName.toLowerCase() === currentUserName.toLowerCase();
                const canEditPost = isAdmin(currentUserRole) ||
                  (isAtLeastEditor(currentUserRole)) ||
                  (isAtLeastContributor(currentUserRole) && isAssignedToCurrentUser);
                const canDeletePost = isAdmin(currentUserRole);
                return (
                  <tr
                    key={post.id}
                    className={`transition hover:bg-gray-50 ${
                      isAssignedToCurrentUser ? "bg-orange-50" : ""
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{post.title}</div>
                      <div className="text-xs text-gray-500">{post.slug}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          statusStyles[post.status] ?? "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-700">{post.authorName}</td>
                    <td className="px-4 py-4 text-gray-600">{formatDate(post.updatedAt)}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          disabled={!canEditPost || isEditingId === post.id}
                          onClick={() => handleStatusUpdate(post.id, post.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED")}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                            canEditPost
                              ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                              : "cursor-not-allowed border-gray-200 text-gray-400"
                          } ${isEditingId === post.id ? "opacity-50" : ""}`}
                        >
                          {post.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          disabled={!canDeletePost || isDeletingId === post.id}
                          onClick={() => handleDelete(post.id)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                            canDeletePost
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "cursor-not-allowed border-gray-200 text-gray-400"
                          } ${isDeletingId === post.id ? "opacity-50" : ""}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {message && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</div>
      )}

      {newPostModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border-4 border-gray-900 bg-white p-6 shadow-[8px_8px_0_0_#1f2937]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Create new post</h3>
              <button onClick={() => setNewPostModalOpen(false)} className="text-gray-500 hover:text-gray-900">
                ×
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                Title
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  placeholder="Post title"
                />
              </label>

              <label className="block text-sm font-semibold text-gray-700">
                Slug (optional)
                <input
                  type="text"
                  value={newPostSlug}
                  onChange={(e) => setNewPostSlug(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  placeholder="slug-example"
                />
              </label>

              <label className="block text-sm font-semibold text-gray-700">
                Content
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={6}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  placeholder="Write the first draft…"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  resetNewPostForm();
                  setNewPostModalOpen(false);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={isSubmitting}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {isSubmitting ? "Creating…" : "Create Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

