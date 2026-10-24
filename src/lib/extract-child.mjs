import { readFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
try {
  const bytes = new Uint8Array(await readFile(process.argv[2]));
  const task = getDocument({
    data: bytes,
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
  });
  const pdf = await task.promise;
  if (pdf.numPages > 10) throw Error("Maximum ten pages.");
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let text = "";
    for (const item of content.items) {
      if ("str" in item) text += item.str + (item.hasEOL ? "\n" : " ");
    }
    pages.push({ page: i, text });
  }
  await task.destroy();
  if (pages.every((p) => p.text.trim().length < 10))
    throw Error("No selectable text. Use manual entry for scanned documents.");
  if (pages.reduce((n, p) => n + p.text.length, 0) > 24000)
    throw Error("Text limit exceeded.");
  process.stdout.write(JSON.stringify(pages));
} catch {
  process.stderr.write(
    "PDF cannot be processed: encrypted, malformed, image-only, over ten pages or text limit exceeded. Manual entry is available.",
  );
  process.exitCode = 1;
}
