'use client';

import { useMemo, useState } from "react";

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
}: {
  posts: DashboardPost[];
  currentUserName?: string;
}) {
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("ALL");
  const authorOptions = useMemo(() => {
    const unique = Array.from(new Set(posts.map((post) => post.authorName || "Unassigned")));
    return ["ALL", ...unique];
  }, [posts]);
  const [authorFilter, setAuthorFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");

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

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Filters</h2>
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
                  currentUserName && post.authorName.toLowerCase() === currentUserName.toLowerCase();
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
                          disabled
                          className="cursor-not-allowed rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500"
                        >
                          Edit
                        </button>
                        <button
                          disabled
                          className="cursor-not-allowed rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500"
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
    </div>
  );
}

