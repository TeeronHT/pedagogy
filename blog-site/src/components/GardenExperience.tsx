"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef } from "react";

type GardenPost = {
  id: string;
  title: string;
  excerpt: string;
  heroImageUrl: string;
  slug: string;
  tags: string[];
  authorName: string;
  authorAvatar: string;
  publishedAt: string;
  readTime: string;
};

type Props = {
  posts: GardenPost[];
};

const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=2000&auto=format&fit=crop";
const DEFAULT_AVATAR = "https://placehold.co/150x150.png?text=AU&background=1f2937&color=ffffff";

const COLORS = {
  grassBase: "#388e3c",
  grassLight: "#4caf50",
  grassDark: "#2e7d32",
  skin: "#ffcc80",
  jacket: "#0277bd",
  hat: "#d32f2f",
  pants: "#263238",
  water: "#29b6f6",
  flowerStems: "#33691e",
  flowers: ["#e91e63", "#9c27b0", "#ffeb3b", "#ffffff", "#ff5722"],
};

class Plant {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  stage: number;
  color: string;
  variant: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.age = 0;
    this.maxAge = 120 + Math.random() * 100;
    this.stage = 0;
    this.color = COLORS.flowers[Math.floor(Math.random() * COLORS.flowers.length)];
    this.variant = Math.floor(Math.random() * 3);
  }

  grow() {
    if (this.age < this.maxAge) {
      this.age++;
      if (this.age > 40) this.stage = 1;
      if (this.age > 90) this.stage = 2;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = COLORS.flowerStems;
    if (this.stage === 0) {
      ctx.fillRect(this.x, this.y, 2, 2);
    } else if (this.stage === 1) {
      ctx.fillRect(this.x, this.y, 1, 2);
      ctx.fillRect(this.x - 1, this.y - 1, 3, 1);
      ctx.fillRect(this.x, this.y - 2, 1, 1);
    } else {
      ctx.fillRect(this.x, this.y, 1, 1);
      ctx.fillRect(this.x, this.y - 1, 1, 3);
      ctx.fillStyle = COLORS.grassDark;
      ctx.fillRect(this.x - 1, this.y - 1, 1, 1);
      ctx.fillRect(this.x + 1, this.y - 1, 1, 1);
      ctx.fillStyle = this.color;
      if (this.variant === 0) {
        ctx.fillRect(this.x - 1, this.y - 4, 3, 3);
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fillRect(this.x - 1, this.y - 2, 3, 1);
        ctx.fillStyle = "#fff";
        ctx.fillRect(this.x, this.y - 3, 1, 1);
      } else {
        ctx.fillRect(this.x, this.y - 4, 1, 1);
        ctx.fillRect(this.x - 1, this.y - 3, 3, 1);
        ctx.fillRect(this.x, this.y - 2, 1, 1);
      }
    }
  }
}

class Particle {
  x: number;
  y: number;
  color: string;
  life: number;
  vx: number;
  vy: number;
  gravity: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.life = 25;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 1) * 1.5;
    this.gravity = 0.05;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.life--;
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.fillRect(Math.round(this.x), Math.round(this.y), 1, 1);
  }
}

const pixelButtonClass =
  "px-3 py-1.5 text-sm font-bold text-gray-900 bg-orange-400 shadow-[2px_2px_0_0_#9a3412] border-2 border-gray-900 hover:bg-orange-300";
const pixelCardClass = "flex flex-col p-4 bg-yellow-50 border-4 border-gray-900 cursor-pointer";
const pixelShadowClass =
  "shadow-[4px_4px_0_0_#1f2937] transition-all duration-150 ease-in-out hover:shadow-[8px_8px_0_0_#f97316] hover:-translate-x-1 hover:-translate-y-1";

const GardenExperience: React.FC<Props> = ({ posts }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clickHandlerRef = useRef<((x: number, y: number) => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const PIXEL_SIZE = 3;
    let logicalWidth = 0;
    let logicalHeight = 0;

    const plants: Plant[] = [];
    const particles: Particle[] = [];
    let grassMap: number[][] = [];
    let animationFrameId: number | null = null;

    const gardener = {
      x: 50,
      y: 50,
      targetX: 50,
      targetY: 50,
      state: "IDLE",
      timer: 0,
      frame: 0,
      direction: 1,
    };

    const generateGrassMap = () => {
      grassMap = [];
      for (let y = 0; y < logicalHeight; y += 2) {
        const row: number[] = [];
        for (let x = 0; x < logicalWidth; x += 2) {
          const r = Math.random();
          if (r > 0.8) row.push(1);
          else if (r > 0.6) row.push(2);
          else row.push(0);
        }
        grassMap.push(row);
      }
    };

    const initialPopulate = () => {
      if (plants.length > 0) return;
      for (let i = 0; i < 40; i++) {
        const plant = new Plant(
          Math.floor(Math.random() * logicalWidth),
          Math.floor(Math.random() * (logicalHeight - 10) + 5)
        );
        plant.age = Math.random() * 100;
        plant.grow();
        plants.push(plant);
      }
    };

    const resize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      logicalWidth = Math.ceil(rect.width / PIXEL_SIZE);
      logicalHeight = Math.ceil(rect.height / PIXEL_SIZE);

      canvas.width = logicalWidth;
      canvas.height = logicalHeight;

      generateGrassMap();
      initialPopulate();
      gardener.x = Math.min(gardener.x, logicalWidth - 10);
      gardener.y = Math.min(gardener.y, logicalHeight - 10);
      gardener.targetX = gardener.x;
      gardener.targetY = gardener.y;
    };

    const spawnWaterParticles = (x: number, y: number) => {
      for (let i = 0; i < 6; i++) {
        particles.push(new Particle(x, y, COLORS.water));
      }
    };

    const updateGardener = () => {
      if (gardener.state === "IDLE") {
        gardener.timer--;
        if (gardener.timer <= 0) {
          gardener.targetX = Math.floor(Math.random() * (logicalWidth - 20)) + 10;
          gardener.targetY = Math.floor(Math.random() * (logicalHeight - 20)) + 10;
          gardener.state = "WALKING";
          gardener.direction = gardener.targetX > gardener.x ? 1 : -1;
        }
      } else if (gardener.state === "WALKING") {
        const speed = 1.5;
        const dx = gardener.targetX - gardener.x;
        const dy = gardener.targetY - gardener.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) {
          gardener.state = "WATERING";
          gardener.timer = 40;
        } else {
          gardener.x += (dx / dist) * speed;
          gardener.y += (dy / dist) * speed;
          gardener.direction = dx > 0 ? 1 : -1;
          gardener.frame += 0.2;
        }
      } else if (gardener.state === "WATERING") {
        gardener.timer--;
        if (gardener.timer % 5 === 0) {
          const spoutX = gardener.direction === 1 ? gardener.x + 10 : gardener.x - 4;
          spawnWaterParticles(spoutX, gardener.y + 6);
          if (Math.random() > 0.6) {
            plants.push(
              new Plant(Math.round(spoutX + (Math.random() * 6 - 3)), Math.round(gardener.y + 10))
            );
          }
        }
        if (gardener.timer <= 0) {
          gardener.state = "IDLE";
          gardener.timer = 40 + Math.random() * 60;
        }
      }
    };

    const drawGardener = (ctx: CanvasRenderingContext2D) => {
      const x = Math.round(gardener.x);
      const y = Math.round(gardener.y);
      const dir = gardener.direction;
      const bob = gardener.state === "WALKING" && Math.sin(gardener.frame) > 0 ? 1 : 0;
      const stepOffset = gardener.state === "WALKING" ? bob : 0;

      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(x + 2, y + 13, 8, 3);

      ctx.fillStyle = COLORS.pants;
      ctx.fillRect(x + 3, y + 10 + stepOffset, 2, 4);
      ctx.fillRect(x + 7, y + 10 - stepOffset, 2, 4);

      ctx.fillStyle = "#111";
      ctx.fillRect(x + 3, y + 13 + stepOffset, 2, 1);
      ctx.fillRect(x + 7, y + 13 - stepOffset, 2, 1);

      ctx.fillStyle = COLORS.jacket;
      ctx.fillRect(x + 2, y + 5, 8, 5);
      ctx.fillStyle = "#005f98";
      ctx.fillRect(x + 2, y + 9, 8, 1);

      ctx.fillStyle = COLORS.skin;
      ctx.fillRect(x + 3, y + 1, 6, 4);

      ctx.fillStyle = COLORS.hat;
      ctx.fillRect(x + 2, y, 8, 2);
      ctx.fillStyle = "#c0392b";
      if (dir === 1) ctx.fillRect(x + 7, y + 1, 4, 1);
      else ctx.fillRect(x + 1, y + 1, 4, 1);

      if (gardener.state === "WATERING") {
        ctx.fillStyle = "#bdc3c7";
        if (dir === 1) {
          ctx.fillRect(x + 8, y + 6, 5, 4);
          ctx.fillStyle = "#7f8c8d";
          ctx.fillRect(x + 13, y + 5, 1, 2);
        } else {
          ctx.fillRect(x - 1, y + 6, 5, 4);
          ctx.fillStyle = "#7f8c8d";
          ctx.fillRect(x - 2, y + 5, 1, 2);
        }
      }
    };

    const loop = () => {
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);
      ctx.fillStyle = COLORS.grassBase;
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);

      for (let y = 0; y < grassMap.length; y++) {
        if (!grassMap[y]) continue;
        for (let x = 0; x < grassMap[y].length; x++) {
          const type = grassMap[y][x];
          const px = x * 2;
          const py = y * 2;
          if (type === 1) {
            ctx.fillStyle = COLORS.grassDark;
            ctx.fillRect(px, py, 2, 1);
            ctx.fillRect(px + 1, py + 1, 1, 1);
          } else if (type === 2) {
            ctx.fillStyle = COLORS.grassLight;
            ctx.fillRect(px, py, 1, 1);
          }
        }
      }

      const renderList: { type: string; obj: Plant | typeof gardener; y: number }[] = [];
      plants.forEach((plant) => {
        plant.grow();
        renderList.push({ type: "plant", obj: plant, y: plant.y });
      });
      updateGardener();
      renderList.push({ type: "gardener", obj: gardener, y: gardener.y + 14 });
      renderList.sort((a, b) => a.y - b.y);
      renderList.forEach((item) => {
        if (item.type === "plant" && item.obj instanceof Plant) item.obj.draw(ctx);
        else if (item.type === "gardener") drawGardener(ctx);
      });

      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
        if (particles[i].life <= 0) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    const handleCanvasClick = (x: number, y: number) => {
      gardener.targetX = Math.max(10, Math.min(logicalWidth - 10, x));
      gardener.targetY = Math.max(10, Math.min(logicalHeight - 10, y));
      gardener.state = "WALKING";
      gardener.direction = gardener.targetX > gardener.x ? 1 : -1;
    };

    clickHandlerRef.current = handleCanvasClick;
    resize();
    gardener.timer = 60;
    loop();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const handleCanvasInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = Math.floor((clientX - rect.left) * scaleX);
    const y = Math.floor((clientY - rect.top) * scaleY);

    if (x > 0 && y > 0 && clickHandlerRef.current) {
      clickHandlerRef.current(x, y);
    }
  };

  const heroPost = posts[0];
  const latestPosts = posts.slice(1);
  const tagCounts = posts
    .flatMap((post) => post.tags)
    .reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});

  const trendingTopics = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center retro-title">
          THE GARDENER&apos;S LOG
        </h1>

        <div className="relative w-full h-[300px] mb-8 border-[8px] border-[#388e3c] shadow-[12px_12px_0_0_#2e7d32]">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasInteraction}
            onTouchStart={handleCanvasInteraction}
            width="800"
            height="300"
            style={{ imageRendering: "pixelated" }}
            className="block w-full h-full"
          />
          <div className="absolute inset-0 flex items-start justify-end pointer-events-none p-3">
            <p className="text-white text-sm sm:text-base font-semibold bg-gray-900/60 px-2 py-1 border border-white/80 rounded text-right">
              Click or Tap on the map to move the Gardener!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-12">
          <section className="lg:col-span-3 space-y-8">
            {posts.length === 0 ? (
              <div className={`${pixelCardClass} ${pixelShadowClass}`}>
                <p className="text-gray-700 text-sm">
                  No published posts yet. Stay tuned for the first entry in the garden log!
                </p>
              </div>
            ) : (
              <div className="columns-1 md:columns-2 gap-6 space-y-6">
                {posts.map((post) => (
                  <div key={post.id} className="break-inside-avoid">
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="lg:col-span-1 space-y-8">
            <TrendingPanel topics={trendingTopics} />
            <div className="p-6 bg-gray-800 border-4 border-gray-900 shadow-[4px_4px_0_0_#f97316] text-white font-mono">
              <h3 className="text-xl font-bold mb-3 text-orange-400 border-b-2 border-orange-400 pb-1">
                <svg
                  className="w-5 h-5 inline mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26c.45.3.85.44 1.25.44.4 0 .8-.14 1.25-.44L21 8M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8l9 6 9-6"
                  ></path>
                </svg>
                FIELD LOG UPDATE
              </h3>
              <p className="text-gray-300 mb-4 text-sm">
                Get new plots (articles) delivered directly. Enter your coordinates below.
              </p>
              <form className="space-y-3">
                <input
                  type="email"
                  placeholder="ENTER EMAIL ADDRESS..."
                  className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-200 border-2 border-gray-900 focus:outline-none focus:ring-0 rounded-none"
                  aria-label="Email address for newsletter"
                  required
                />
                <button
                  type="submit"
                  className={`w-full inline-flex items-center justify-center bg-orange-600 px-4 py-2 text-sm font-bold text-gray-900 hover:bg-orange-500 ${pixelButtonClass}`}
                >
                  INITIATE SUBSCRIPTION
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    ></path>
                  </svg>
                </button>
              </form>
            </div>
          </aside>
        </div>
    </main>
  );
};

const HeroPost = ({ post }: { post: GardenPost }) => (
  <Link href={`/posts/${post.slug}`} className="block group focus:outline-none">
    <article className="relative w-full min-h-[320px] overflow-hidden rounded-2xl border-4 border-gray-900 shadow-[8px_8px_0_0_#1f2937]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${post.heroImageUrl || DEFAULT_HERO_IMAGE})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="relative p-8 text-white space-y-4">
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-orange-500/80 px-3 py-1 text-xs font-semibold"
            >
              {tag}
            </span>
          ))}
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold leading-tight group-hover:text-orange-200">
          {post.title}
        </h2>
        <p className="text-base text-gray-200 line-clamp-3">{post.excerpt}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-200">
          <AuthorBadge name={post.authorName} avatar={post.authorAvatar} />
          <span>{formatDate(post.publishedAt)}</span>
          <span>{post.readTime}</span>
        </div>
      </div>
    </article>
  </Link>
);

const PostCard = ({ post }: { post: GardenPost }) => (
  <Link href={`/posts/${post.slug}`} className="block group focus:outline-none">
    <article className={`${pixelCardClass} ${pixelShadowClass}`}>
      <div className="relative aspect-video mb-4 overflow-hidden">
        <Image
          src={post.heroImageUrl || DEFAULT_HERO_IMAGE}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {post.tags.map((tag) => (
          <span
            key={`${post.id}-${tag}`}
            className="inline-flex items-center rounded-full bg-orange-600 px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wider border-b-2 border-r-2 border-orange-800"
          >
            {tag}
          </span>
        ))}
      </div>
      <h3 className="text-xl font-extrabold leading-snug mb-2 text-gray-900 group-hover:text-orange-700">
        {post.title}
      </h3>
      <p className="text-gray-700 text-sm mb-4 line-clamp-3 font-mono">{post.excerpt}</p>
      <div className="mt-auto pt-3 border-t-2 border-gray-900/10 flex items-center justify-between text-xs">
        <AuthorBadge name={post.authorName} avatar={post.authorAvatar} />
        <div className="flex items-center space-x-3 text-gray-600">
          <span>{formatDate(post.publishedAt)}</span>
          <span>{post.readTime}</span>
        </div>
      </div>
    </article>
  </Link>
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

const TrendingPanel = ({ topics }: { topics: Array<[string, number]> }) => (
  <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
    <h2 className="text-xl font-bold mb-4 border-b pb-2">Trending Topics</h2>
    {topics.length === 0 ? (
      <p className="text-sm text-gray-500">Tags will appear once posts are published.</p>
    ) : (
      <div className="flex flex-wrap gap-3">
        {topics.map(([tag, count]) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700"
          >
            {tag}
            <span className="ml-2 text-xs font-semibold text-indigo-500">({count})</span>
          </span>
        ))}
      </div>
    )}
  </div>
);

const formatDate = (date: string) => {
  if (!date) return "TBD";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default GardenExperience;
export type { GardenPost };

