'use client';

import React, { useRef, useEffect, useState } from 'react';

// Define the component as the default export for a Next.js page
const App: React.FC = () => {
    // Ref to hold the canvas DOM element
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Ref to store the function that moves the gardener, exposed from useEffect
    const clickHandlerRef = useRef<((x: number, y: number) => void) | null>(null);

    // State is unused now but kept for consistency
    const [isInitialized, setIsInitialized] = useState(false);

    // --- Tailwind Custom Styles (using inline styles for the font import) ---
    const retroTitleClass = "text-3xl sm:text-4xl font-extrabold text-yellow-300 tracking-tighter retro-title";
    const pixelShadowClass = "shadow-[4px_4px_0_0_#1f2937] transition-all duration-150 ease-in-out hover:shadow-[8px_8px_0_0_#f97316] hover:translate-x-[-4px] hover:translate-y-[-4px]";
    const pixelButtonClass = "px-3 py-1.5 text-sm font-bold text-gray-900 bg-orange-400 shadow-[2px_2px_0_0_#9a3412] border-2 border-gray-900 hover:bg-orange-300";
    const pixelCardClass = "flex flex-col p-4 bg-yellow-50 border-4 border-gray-900 cursor-pointer";

    // --- Canvas Simulation Logic Hook (useEffect) ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Constants from the original JS
        const PIXEL_SIZE = 3;
        let logicalWidth = 0;
        let logicalHeight = 0;

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

        // Internal simulation state (not React state)
        let plants: Plant[] = [];
        let particles: Particle[] = [];
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
            direction: 1, // 1 for right, -1 for left
        };

        // --- Classes (Re-defined for TypeScript) ---

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

        // --- Core Functions ---

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
            if (plants.length > 0) return; // Only populate on first load
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
            // Adjust gardener position if they are outside the new bounds
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
                // FIX 2: Increased speed from 0.8 to 1.5
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
                            new Plant(
                                Math.round(spoutX + (Math.random() * 6 - 3)),
                                Math.round(gardener.y + 10)
                            )
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

            ctx.fillStyle = "#111"; // Shoes
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

        // Main animation loop
        const loop = () => {
            ctx.clearRect(0, 0, logicalWidth, logicalHeight);
            ctx.fillStyle = COLORS.grassBase;
            ctx.fillRect(0, 0, logicalWidth, logicalHeight);

            // Draw Grass Texture
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

            const renderList: { type: string, obj: Plant | typeof gardener, y: number }[] = [];
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
            // Set new target for the gardener
            gardener.targetX = Math.max(10, Math.min(logicalWidth - 10, x));
            gardener.targetY = Math.max(10, Math.min(logicalHeight - 10, y));

            gardener.state = "WALKING";
            gardener.direction = gardener.targetX > gardener.x ? 1 : -1;
        };
        
        // FIX 1: Expose the click handler function via the ref
        clickHandlerRef.current = handleCanvasClick;

        // --- Initialization and Cleanup ---

        // 1. Initial size setup
        resize();
        gardener.timer = 60; // Initial idle time
        
        // 2. Start animation loop
        loop();

        // 3. Add window resize listener
        window.addEventListener("resize", resize);

        // Cleanup function for the effect
        return () => {
            window.removeEventListener("resize", resize);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, []); // Empty dependency array ensures it runs once on mount

    // --- React Event Handlers (calling the internal logic via Ref) ---
    const handleCanvasInteraction = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        const x = Math.floor((clientX - rect.left) * scaleX);
        const y = Math.floor((clientY - rect.top) * scaleY);

        // Call the core logic function using the ref
        if (x > 0 && y > 0 && clickHandlerRef.current) {
             clickHandlerRef.current(x, y);
        }
    };

    return (
        <>
            {/* Inject Font Link (for environments where this is needed in the component) */}
            <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
            
            {/* Custom Styles using <style> tag for non-Tailwind properties like font-family and image-rendering */}
            <style>{`
                /* Global styles for the 8-bit aesthetic */
                body {
                    /* Background pattern to mimic tiled game map */
                    background-color: #fefefe;
                    background-image: radial-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px), radial-gradient(rgba(0, 0, 0, 0.1) 1px, #fefefe 1px);
                    background-size: 20px 20px;
                    background-position: 0 0, 10px 10px;
                    font-family: 'Inter', sans-serif;
                }
                .retro-title {
                    text-shadow: 3px 3px #f97316;
                    font-family: 'Press Start 2P', cursive;
                }
                #garden-container {
                    /* Thick frame */
                    border: 8px solid #388e3c; 
                    box-shadow: 12px 12px 0 0 #2e7d32;
                }
                #pixelGardenCanvas {
                    image-rendering: optimizeSpeed;
                    image-rendering: -moz-crisp-edges;
                    image-rendering: -webkit-optimize-contrast;
                    image-rendering: optimize-contrast;
                    image-rendering: pixelated;
                    width: 100%;
                    height: 100%;
                    display: block;
                }
            `}</style>


            {/* Header (Styled as an 8-bit Banner) */}
            <nav className="border-b-4 border-gray-900 bg-green-700/80 sticky top-0 z-10 shadow-[0_4px_0_0_#1f2937]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                    <a href="#" className={retroTitleClass}>
                        DEVPLOTS
                    </a>
                    <div className="hidden md:flex space-x-6 text-sm font-bold text-yellow-100">
                        <a href="#" className="hover:text-orange-300 transition duration-100">HOME</a>
                        <a href="#" className="hover:text-orange-300 transition duration-100">AUTHORS</a>
                        <a href="#" className="hover:text-orange-300 transition duration-100">ABOUT</a>
                    </div>
                    <button className={`${pixelButtonClass} hidden sm:block`}>
                        START PLOTTING
                    </button>
                </div>
            </nav>

            {/* Main Content Area - The Garden Map */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center retro-title">
                    THE GARDENER'S LOG
                </h1>

                {/* Canvas Container: The Live Pixel Garden Map */}
                <div id="garden-container" className="relative w-full h-[300px] mb-8">
                    <canvas 
                        ref={canvasRef} 
                        id="pixelGardenCanvas" 
                        onClick={handleCanvasInteraction}
                        onTouchStart={handleCanvasInteraction}
                        width="800" 
                        height="300"
                    />
                    {/* Instruction overlay */}
                    <div className="absolute inset-0 flex items-start justify-end pointer-events-none p-3">
                        <p className="text-white text-sm sm:text-base font-semibold bg-gray-900/60 px-2 py-1 border border-white/80 rounded text-right">
                            Click or Tap on the map to move the Gardener!
                        </p>
                    </div>
                </div>


                {/* Split Layout: Posts Grid + Sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-12">

                    {/* Left/Main Column: Latest Posts Grid (The Plots) */}
                    <section className="lg:col-span-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Article Card 1 */}
                            <article className={`${pixelCardClass} ${pixelShadowClass}`}>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="inline-block bg-orange-600 px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wider border-b-2 border-r-2 border-orange-800">
                                        Philosophy
                                    </span>
                                </div>
                                <h3 className="text-xl font-extrabold leading-snug mb-2 text-gray-900 group-hover:text-orange-700">
                                    The Paradox of Choice in Modern AI Tools
                                </h3>
                                <p className="text-gray-700 text-sm mb-4 line-clamp-3 font-mono">
                                    An exploration of how the sheer volume of generative AI tools can sometimes stifle creativity rather than enhance it.
                                </p>
                                <div className="mt-auto pt-3 border-t-2 border-gray-900/10 flex items-center justify-between text-xs">
                                    <div className="flex items-center space-x-2">
                                        <img className="h-6 w-6 rounded-full object-cover border-2 border-gray-900" src="https://placehold.co/150x150/ffc0cb/black?text=A" alt="Alice Johnson"/>
                                        <span className="font-bold text-gray-900">Alice Johnson</span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-gray-600">
                                        <svg className="w-3 h-3 text-orange-600 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        <span>11/20/23</span>
                                    </div>
                                </div>
                            </article>
                            
                            {/* Article Card 2 */}
                            <article className={`${pixelCardClass} ${pixelShadowClass}`}>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="inline-block bg-orange-600 px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wider border-b-2 border-r-2 border-orange-800">
                                        Finance
                                    </span>
                                </div>
                                <h3 className="text-xl font-extrabold leading-snug mb-2 text-gray-900 group-hover:text-orange-700">
                                    The Subtle Art of Long-Term Value Investing
                                </h3>
                                <p className="text-gray-700 text-sm mb-4 line-clamp-3 font-mono">
                                    Diving into Buffet's principles and how they apply to volatile modern markets, focusing on intrinsic value over speculation.
                                </p>
                                <div className="mt-auto pt-3 border-t-2 border-gray-900/10 flex items-center justify-between text-xs">
                                    <div className="flex items-center space-x-2">
                                        <img className="h-6 w-6 rounded-full object-cover border-2 border-gray-900" src="https://placehold.co/150x150/add8e6/black?text=B" alt="Bob Smith"/>
                                        <span className="font-bold text-gray-900">Bob Smith</span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-gray-600">
                                        <svg className="w-3 h-3 text-orange-600 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        <span>11/18/23</span>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </section>

                    {/* Right Column: Sidebar (The Terminal/Log Book) */}
                    <section className="lg:col-span-1">
                        <aside className="space-y-8">
                            {/* Newsletter CTA Card - Styled as a Retro Terminal */}
                            <div className="p-6 bg-gray-800 border-4 border-gray-900 shadow-[4px_4px_0_0_#f97316] text-white font-mono">
                                <h3 className="text-xl font-bold mb-3 text-orange-400 border-b-2 border-orange-400 pb-1">
                                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26c.45.3.85.44 1.25.44.4 0 .8-.14 1.25-.44L21 8M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8l9 6 9-6"></path></svg>
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
                                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                    </button>
                                </form>
                            </div>
                        </aside>
                    </section>
                </div>
            </main>

            {/* Footer (Styled as the Ground/Foundation) */}
            <footer className="bg-gray-900 mt-12 border-t-4 border-orange-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-400 font-mono">
                    SYSTEM FOOTER | &copy; 2025 DEVPLOTS. ALL RIGHTS RESERVED. (Pixelated Mock Layout)
                </div>
            </footer>
        </>
    );
};

export default App;