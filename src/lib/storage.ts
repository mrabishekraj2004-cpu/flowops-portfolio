import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
export const MAX_FILE = 5 * 1024 * 1024;
export interface PrivateStorage {
  put(bytes: Uint8Array): Promise<{ key: string; sha256: string }>;
  get(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}
function location(key: string) {
  if (!/^[a-f0-9-]{36}\.pdf$/.test(key)) throw Error("Invalid storage key.");
  return path.join(
    path.resolve(process.env.STORAGE_DIR ?? ".local/documents"),
    key,
  );
}
export const storage: PrivateStorage = {
  async put(bytes) {
    if (
      bytes.length < 8 ||
      bytes.length > MAX_FILE ||
      Buffer.from(bytes.subarray(0, 5)).toString() !== "%PDF-"
    )
      throw Error("Upload a PDF of at most 5 MB.");
    const key = randomUUID() + ".pdf";
    await mkdir(path.dirname(location(key)), { recursive: true });
    await writeFile(location(key), bytes, { flag: "wx", mode: 0o600 });
    return { key, sha256: createHash("sha256").update(bytes).digest("hex") };
  },
  async get(key) {
    return readFile(location(key));
  },
  async remove(key) {
    await unlink(location(key));
  },
};
export function privateFilePath(key: string) {
  return location(key);
}
