import { openDB, type DBSchema } from "idb";

export type Item = { id: string; prompt: string; createdAt: number; blob: Blob };

interface Schema extends DBSchema {
  history: { key: string; value: Item; indexes: { createdAt: number } };
}

export const MAX_ITEMS = 50;

const db = () =>
  openDB<Schema>("imggen", 1, {
    upgrade(d) {
      d.createObjectStore("history", { keyPath: "id" }).createIndex("createdAt", "createdAt");
    },
  });

export async function listItems(): Promise<Item[]> {
  return (await (await db()).getAllFromIndex("history", "createdAt")).reverse();
}

export async function addItem(item: Item) {
  const d = await db();
  await d.put("history", item);
  const keys = await d.getAllKeysFromIndex("history", "createdAt");
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_ITEMS))) await d.delete("history", k);
}

export async function removeItem(id: string) {
  await (await db()).delete("history", id);
}
