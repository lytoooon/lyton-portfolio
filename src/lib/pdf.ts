// A tiny PDF writer, just enough for a one or two page text CV.
// It uses the two standard PDF fonts (Helvetica and Helvetica Bold), so nothing
// has to be embedded and no package is needed. Text must be plain ASCII; the
// clean() helper swaps curly quotes and dashes for their plain versions.

export type Rgb = [number, number, number];
export type FontName = "regular" | "bold";

// Character widths per 1000 units of font size, for ASCII 32 to 126.
const WIDTHS: Record<FontName, number[]> = {
  regular: [
    278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
    556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
    1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
    667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
    333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
    556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
  ],
  bold: [
    278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
    556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
    975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
    667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
    333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
    611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
  ],
};

export function clean(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E]/g, "");
}

function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

const n = (value: number) => value.toFixed(2).replace(/\.?0+$/, "");
const rgb = (c: Rgb) => `${n(c[0])} ${n(c[1])} ${n(c[2])}`;

type Page = {
  ops: string[];
  links: { rect: [number, number, number, number]; url: string }[];
};

export class Pdf {
  readonly width = 595.28; // A4
  readonly height = 841.89;
  private pages: Page[] = [];
  private info: { title: string; author: string };

  constructor(info: { title: string; author: string }) {
    this.info = info;
    this.addPage();
  }

  addPage() {
    this.pages.push({ ops: [], links: [] });
  }

  private get page(): Page {
    return this.pages[this.pages.length - 1];
  }

  /** Width of a string in points. */
  measure(text: string, size: number, font: FontName = "regular", charSpace = 0): number {
    let total = 0;
    for (const ch of clean(text)) {
      total += (WIDTHS[font][ch.charCodeAt(0) - 32] ?? 556) * size / 1000 + charSpace;
    }
    return total;
  }

  /** Splits text into lines that fit within maxWidth. */
  wrap(text: string, size: number, font: FontName, maxWidth: number): string[] {
    const lines: string[] = [];
    let line = "";
    for (const word of clean(text).split(/\s+/).filter(Boolean)) {
      const attempt = line ? `${line} ${word}` : word;
      if (line && this.measure(attempt, size, font) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = attempt;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  text(
    text: string,
    opts: { x: number; y: number; size: number; font?: FontName; color?: Rgb; charSpace?: number },
  ) {
    const { x, y, size, font = "regular", color = [0, 0, 0], charSpace = 0 } = opts;
    const face = font === "bold" ? "F2" : "F1";
    this.page.ops.push(
      `BT /${face} ${n(size)} Tf ${rgb(color)} rg ${n(charSpace)} Tc ${n(x)} ${n(y)} Td (${escapeText(clean(text))}) Tj ET`,
    );
  }

  rect(x: number, y: number, w: number, h: number, color: Rgb) {
    this.page.ops.push(`${rgb(color)} rg ${n(x)} ${n(y)} ${n(w)} ${n(h)} re f`);
  }

  link(x: number, y: number, w: number, h: number, url: string) {
    this.page.links.push({ rect: [x, y, x + w, y + h], url });
  }

  /** Assembles the finished file. */
  build(): Uint8Array {
    // Object numbers: 1 catalog, 2 page tree, 3 and 4 fonts, 5 info, then 3 per page.
    const objects: string[] = [];
    const pageObjectNumbers: number[] = [];
    const first = 6;
    const annotCounts = this.pages.map((p) => p.links.length);
    let next = first;
    const layout = this.pages.map((_, i) => {
      const pageNo = next;
      const contentNo = next + 1;
      const annotStart = next + 2;
      next += 2 + annotCounts[i];
      pageObjectNumbers.push(pageNo);
      return { pageNo, contentNo, annotStart };
    });

    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[2] = `<< /Type /Pages /Count ${this.pages.length} /Kids [${pageObjectNumbers.map((p) => `${p} 0 R`).join(" ")}] >>`;
    objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
    objects[5] = `<< /Title (${escapeText(clean(this.info.title))}) /Author (${escapeText(clean(this.info.author))}) >>`;

    this.pages.forEach((page, i) => {
      const { pageNo, contentNo, annotStart } = layout[i];
      const stream = page.ops.join("\n");
      const annots = page.links.map((_, k) => `${annotStart + k} 0 R`).join(" ");
      objects[pageNo] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(this.width)} ${n(this.height)}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNo} 0 R` +
        (annots ? ` /Annots [${annots}]` : "") +
        " >>";
      objects[contentNo] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
      page.links.forEach((l, k) => {
        objects[annotStart + k] =
          `<< /Type /Annot /Subtype /Link /Rect [${l.rect.map(n).join(" ")}] /Border [0 0 0] ` +
          `/A << /S /URI /URI (${escapeText(l.url)}) >> >>`;
      });
    });

    // Every character is plain ASCII, so one character is one byte and the
    // byte offsets in the cross-reference table can be counted from string length.
    let out = "%PDF-1.4\n";
    const offsets: number[] = [];
    for (let i = 1; i < objects.length; i++) {
      offsets[i] = out.length;
      out += `${i} 0 obj\n${objects[i]}\nendobj\n`;
    }
    const xref = out.length;
    out += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let i = 1; i < objects.length; i++) {
      out += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    out += `trailer\n<< /Size ${objects.length} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF`;

    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
    return bytes;
  }
}
