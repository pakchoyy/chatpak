"use client";

import { useEffect, useState } from "react";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// "native": Android/desktop Chrome bisa memunculkan dialog pasang.
// "ios": Safari tidak punya dialog; tampilkan petunjuk manual.
// "manual": browser belum memberi sinyal pasang; tampilkan petunjuk menu browser.
export function useInstall() {
  const [evt, setEvt] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as PromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const mode: "native" | "ios" | "manual" | null = installed ? null : evt ? "native" : ios ? "ios" : "manual";

  async function install() {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice.catch(() => null);
    setEvt(null);
  }

  return { mode, install };
}
