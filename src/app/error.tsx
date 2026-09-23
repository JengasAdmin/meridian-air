"use client";

import { useLang } from "@/i18n/client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useLang();
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="font-mono text-7xl font-bold text-red-400">500</div>
      <h1 className="heading-md mt-6">{t("error.generic")}</h1>
      <button className="btn-primary mt-8" onClick={reset}>↻</button>
    </div>
  );
}
