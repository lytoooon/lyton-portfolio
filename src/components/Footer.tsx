import { contact, person, socials } from "@/data/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-bg py-14">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg text-fg">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-lime" />
              {person.name}
            </p>
            <p className="mt-2 text-sm text-muted">{person.location}</p>
          </div>

          <div>
            <p className="text-sm text-fg">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <a href={`mailto:${contact.email}`} className="hover:text-lime">
                  {contact.email}
                </a>
              </li>
              <li>
                <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="hover:text-lime">
                  {contact.phone}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm text-fg">Elsewhere</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:text-lime"
                  >
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
                <a href="#top" className="hover:text-lime">
                  Back to top
                </a>
              </li>
              <li>
                <a href="#work" className="hover:text-lime">
                  Work
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-14 text-xs text-muted">
          © {year} {person.name}. Built with Next.js, GSAP, and Tailwind CSS.
        </p>
      </div>
    </footer>
  );
}
