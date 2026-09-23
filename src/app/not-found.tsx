"use client";

import Link from "next/link";
import { useLang } from "@/i18n/client";

export default function NotFound() {
  const { t } = useLang();
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="font-mono text-7xl font-bold text-electric">404</div>
      <h1 className="heading-md mt-6">{t("error.404.title")}</h1>
      <p className="mt-2 max-w-md text-steel">{t("error.404.sub")}</p>
      <Link href="/" className="btn-primary mt-8">{t("error.goHome")}</Link>
    </div>
  );
}
