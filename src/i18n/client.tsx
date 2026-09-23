"use client";
import { createContext, useContext, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dict } from "./ru";

type Ctx = { lang: "ru" | "en"; dict: Dict; setLang: (l: "ru" | "en") => void };
const LangCtx = createContext<Ctx | null>(null);

export function LangProvider({
  lang,
  dict,
  children,
}: {
  lang: "ru" | "en";
  dict: Dict;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const setLang = (l: "ru" | "en") => {
    document.cookie = `lang=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
    startTransition(() => router.refresh());
  };
  return <LangCtx.Provider value={{ lang, dict, setLang }}>{children}</LangCtx.Provider>;
}

export function useLang(): { lang: "ru" | "en"; t: (key: string) => string; setLang: (l: "ru" | "en") => void } {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useLang outside provider");
  return { lang: ctx.lang, t: (k) => (ctx.dict as Record<string, string>)[k] ?? k, setLang: ctx.setLang };
}
