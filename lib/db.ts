import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type Msg = {
  id: string;
  role: "user" | "assistant";
  kind: "text" | "image";
  text: string; // isi teks, atau prompt untuk gambar
  blob?: Blob; // hanya untuk gambar hasil
  error?: string;
};

export type Chat = { id: string; title: string; createdAt: number; updatedAt: number; messages: Msg[] };

type OldItem = { id: string; prompt: string; createdAt: number; blob: Blob };

interface Schema extends DBSchema {
  chats: { key: string; value: Chat; indexes: { updatedAt: number } };
  history: { key: string; value: OldItem; indexes: { createdAt: number } };
}

export const MAX_CHATS = 50;

let dbp: Promise<IDBPDatabase<Schema>> | null = null;

const db = () =>
  (dbp ??= openDB<Schema>("imggen", 2, {
    // Tab lain minta versi baru: lepaskan koneksi supaya upgrade-nya tidak tertahan.
    blocking(_cur, _next, ev) {
      (ev.target as IDBDatabase).close();
      dbp = null;
    },
    async upgrade(d, oldVersion, _v, tx) {
      if (oldVersion < 1) d.createObjectStore("history", { keyPath: "id" }).createIndex("createdAt", "createdAt");
      if (oldVersion < 2) {
        d.createObjectStore("chats", { keyPath: "id" }).createIndex("updatedAt", "updatedAt");
        // Pindahkan riwayat gambar versi 1: satu gambar = satu percakapan.
        for (const it of await tx.objectStore("history").getAll()) {
          await tx.objectStore("chats").put({
            id: it.id,
            title: it.prompt.slice(0, 60),
            createdAt: it.createdAt,
            updatedAt: it.createdAt,
            messages: [
              { id: crypto.randomUUID(), role: "user", kind: "image", text: it.prompt },
              { id: crypto.randomUUID(), role: "assistant", kind: "image", text: it.prompt, blob: it.blob },
            ],
          });
        }
        await tx.objectStore("history").clear();
      }
    },
  }).catch((e) => {
    dbp = null; // coba buka lagi di panggilan berikutnya
    throw e;
  }));

export async function listChats(): Promise<Chat[]> {
  return (await (await db()).getAllFromIndex("chats", "updatedAt")).reverse();
}

export async function saveChat(chat: Chat) {
  const d = await db();
  await d.put("chats", chat);
  const keys = await d.getAllKeysFromIndex("chats", "updatedAt");
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_CHATS))) await d.delete("chats", k);
}

export async function deleteChat(id: string) {
  await (await db()).delete("chats", id);
}
