import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import PageChrome from "@/components/PageChrome";
import { prisma } from "@/lib/prisma";
import { computeReadTime } from "@/lib/postFormatter";

export const revalidate = 0;

const DEFAULT_HERO_IMAGE =
  "https://placehold.co/800x450/4CAF50/000000?text=PIXEL+GARDEN+POST";
const DEFAULT_AVATAR = "https://placehold.co/150x150/1f2937/ffffff?text=AU";
const pixelButtonBack =
  "inline-flex items-center px-4 py-2 text-sm font-bold text-gray-900 bg-yellow-400 shadow-[2px_2px_0_0_#b45309] border-2 border-gray-900 hover:bg-yellow-300 transition duration-150";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

type GardenPostView = {
  title: string;
  excerpt: string;
  heroImageUrl: string;
  tags: string[];
  authorName: string;
  authorAvatar: string;
  publishedAt: string;
  readTime: string;
  content: string;
};

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true, avatarUrl: true } },
      tags: { include: { tag: true } },
    },
  });

  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  const viewPost: GardenPostView = {
    title: post.title,
    excerpt: post.excerpt ?? "",
    heroImageUrl: post.heroImageUrl ?? DEFAULT_HERO_IMAGE,
    tags: post.tags.map((tag) => tag.tag.name),
    authorName: post.author?.name ?? "Unknown Gardener",
    authorAvatar: post.author?.avatarUrl ?? DEFAULT_AVATAR,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : "",
    readTime: computeReadTime(post.contentMd),
    content: post.contentMd,
  };

  return (
    <PageChrome>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        <PostView post={viewPost} />
      </main>
    </PageChrome>
  );
}

const PostView = ({ post }: { post: GardenPostView }) => (
  <div className="space-y-8">
    <Link href="/" className={pixelButtonBack}>
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      BACK TO LOG
    </Link>

    <div className="relative w-full aspect-video overflow-hidden rounded-2xl border-4 border-gray-900 shadow-[8px_8px_0_0_#1f2937]">
      <Image
        src={post.heroImageUrl || DEFAULT_HERO_IMAGE}
        alt={`Hero image for ${post.title}`}
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 70vw"
        priority
      />
    </div>

    <div className="p-4 bg-white border-4 border-gray-900 shadow-[4px_4px_0_0_#f97316] space-y-4">
      <h1 className="text-4xl font-extrabold text-gray-900">{post.title}</h1>
      <p className="text-gray-600 text-base">{post.excerpt}</p>
      <div className="flex flex-wrap items-center gap-6 border-b pb-4">
        <AuthorBadge name={post.authorName} avatar={post.authorAvatar} />
        <span className="text-sm text-gray-600 font-mono">Published: {formatDate(post.publishedAt)}</span>
        <span className="text-sm text-gray-600 font-mono">Read Time: {post.readTime}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider border-b-2 border-r-2 border-orange-800"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>

    <div className="p-8 bg-gray-50 border-4 border-gray-900 font-serif text-lg leading-relaxed shadow-[4px_4px_0_0_#1f2937]">
      {renderPostContent(post.content)}
      <div className="mt-8 pt-4 border-t text-sm text-gray-600 italic">
        --- End of Post: Thank you for reading the latest plot in our garden log. ---
      </div>
    </div>

    <Link href="/" className={pixelButtonBack}>
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      RETURN TO LOG
    </Link>
  </div>
);

const AuthorBadge = ({ name, avatar }: { name: string; avatar: string }) => (
  <div className="flex items-center space-x-2">
    <Image
      className="h-6 w-6 rounded-full object-cover border-2 border-gray-900"
      src={avatar || DEFAULT_AVATAR}
      alt={name}
      width={24}
      height={24}
    />
    <span className="font-bold text-gray-900">{name}</span>
  </div>
);

const renderPostContent = (content: string) => {
  if (!content) return <p>No content yet.</p>;

  return content.split("\n\n").map((paragraph, index) => {
    if (paragraph.startsWith("##")) {
      return (
        <h3 key={index} className="text-2xl font-bold mt-8 mb-4 border-b-2 border-gray-900 pb-1">
          {paragraph.substring(2).trim()}
        </h3>
      );
    }

    return (
      <p key={index} className="mb-6">
        {paragraph}
      </p>
    );
  });
};

const formatDate = (date: string) => {
  if (!date) return "TBD";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
