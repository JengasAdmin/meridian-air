import "server-only";
import { cookies } from "next/headers";
import { ru, Dict } from "./ru";
import { en } from "./en";

export type Lang = "ru" | "en";
export const dicts: Record<Lang, Dict> = { ru, en };

export function getDict(lang?: string | null): Dict {
  return dicts[(lang as Lang) in dicts ? (lang as Lang) : "ru"];
}

export async function serverLang(): Promise<{ lang: Lang; dict: Dict }> {
  const lang = ((await cookies()).get("lang")?.value as Lang) || "ru";
  return { lang: lang in dicts ? lang : "ru", dict: dicts[lang in dicts ? lang : "ru"] };
}
