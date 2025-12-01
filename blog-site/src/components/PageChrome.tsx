import Link from "next/link";

type PageChromeProps = {
  children: React.ReactNode;
};

const pixelButtonClass =
  "px-3 py-1.5 text-sm font-bold text-gray-900 bg-orange-400 shadow-[2px_2px_0_0_#9a3412] border-2 border-gray-900 hover:bg-orange-300 transition duration-150 ease-in-out";

export default function PageChrome({ children }: PageChromeProps) {
  return (
    <>
      <nav className="border-b-4 border-gray-900 bg-green-700/80 sticky top-0 z-10 shadow-[0_4px_0_0_#1f2937]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Link href="/" className="text-3xl sm:text-4xl font-extrabold text-yellow-300 tracking-tighter retro-title">
            DEVPLOTS
          </Link>
          <div className="hidden md:flex space-x-6 text-sm font-bold text-yellow-100">
            <Link href="/" className="hover:text-orange-300 transition duration-100">
              HOME
            </Link>
            <a href="#authors" className="hover:text-orange-300 transition duration-100">
              AUTHORS
            </a>
            <a href="#about" className="hover:text-orange-300 transition duration-100">
              ABOUT
            </a>
          </div>
          <button className={`${pixelButtonClass} hidden sm:block`}>START PLOTTING</button>
        </div>
      </nav>
      {children}
      <footer className="bg-gray-900 mt-12 border-t-4 border-orange-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-400 font-mono">
        SYSTEM FOOTER | &copy; {new Date().getFullYear()} DEVPLOTS. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </>
  );
}

