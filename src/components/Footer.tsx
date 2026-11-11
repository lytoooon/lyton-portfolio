import Link from "next/link";
import { person, socials } from "@/data/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-[1] mt-[30vh] border-t border-line bg-bg py-14">
      <div className="wrap">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="flex items-center gap-2 font-display text-lg text-fg">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-lime" />
              {person.name}
            </p>
            <p className="mt-2 text-sm text-muted">{person.location}</p>
          </div>

          <div>
            <p className="text-sm text-fg">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <a href={`mailto:${person.email}`} className="hover:text-fg">
                  {person.email}
                </a>
              </li>
              <li>
                <a href={`tel:${person.phone.replace(/\s+/g, "")}`} className="hover:text-fg">
                  {person.phone}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm text-fg">Elsewhere</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer noopener" className="hover:text-fg">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm text-fg">Site</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <Link href="/#top" className="hover:text-fg">
                  Back to top
                </Link>
              </li>
              <li>
                <Link href="/#work" className="hover:text-fg">
                  Work
                </Link>
              </li>
              <li>
                <a href={person.cvPath} download={person.cvFileName} className="hover:text-fg">
                  Download CV
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-14 text-xs text-muted">
          &copy; {year} {person.name}. Built with Next.js, GSAP and Tailwind CSS.
        </p>
      </div>
    </footer>
  );
}
