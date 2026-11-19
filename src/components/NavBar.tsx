import Link from "next/link";
import { person } from "@/data/site";

/**
 * The header on case study pages: a way back to the work on the left, the
 * "Let's talk" on the right. (The home page uses
 * film/RightNav.tsx instead.)
 */
export default function NavBar() {
  return (
    <header className="page-top">
      <Link href="/#work" className="brand">
        <span className="brand-mark">&larr; Work</span>
        <span className="brand-sub">{person.name}</span>
      </Link>
      <div className="topright">
        <Link href="/#contact" className="pill">
          Let&rsquo;s talk
        </Link>
      </div>
    </header>
  );
}
