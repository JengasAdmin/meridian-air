"use client";

import { useLang } from "@/i18n/client";
import { SectionTitle } from "@/components/ui";
import { LiveOpsTeaser } from "@/components/LiveOpsTeaser";

export default function LivePage() {
  const { t } = useLang();
  return (
    <div className="container-page section">
      <SectionTitle title={t("live.title")} sub={t("live.sub")} />
      <LiveOpsTeaser full />
    </div>
  );
}
