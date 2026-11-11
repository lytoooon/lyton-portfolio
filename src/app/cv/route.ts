import { buildCv } from "@/lib/cv";
import { person } from "@/data/site";

// Built once at deploy time. The CV is made from src/data, so editing the
// content files and redeploying updates the download automatically.
export const dynamic = "force-static";

export function GET() {
  const bytes = buildCv();
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${person.cvFileName}"`,
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
