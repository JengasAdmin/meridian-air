"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n/client";
import { Skeleton } from "@/components/ui";

type Channel = { key: string; channelId: string };

const CHANNEL_KEYS = [
  "flight-bookings", "flight-reports", "live-flights",
  "pilot-applications", "system-logs", "announcements", "operations",
];

export default function AdminDiscordSettingsPage() {
  const { t } = useLang();
  const [channels, setChannels] = useState<Channel[] | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setChannels(d.channels ?? []));
  }, []);

  async function save() {
    if (!channels) return;
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channels }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!channels) return <Skeleton className="h-80" />;

  return (
    <div className="max-w-xl">
      <h2 className="heading-md mb-2">{t("admin.channelMapping")}</h2>
      <p className="mb-6 text-sm text-steel">
        Discord Channel IDs → указываются ID каналов сервера Meridian AIR. Бот читает эту таблицу при отправке событий.
      </p>
      <div className="space-y-3">
        {CHANNEL_KEYS.map((key) => (
          <div key={key} className="flex items-center gap-3">
            <span className="w-44 shrink-0 font-mono text-sm text-steel">{key}</span>
            <input
              className="input"
              placeholder="000000000000000000"
              value={channels.find((c) => c.key === key)?.channelId ?? ""}
              onChange={(e) =>
                setChannels((cs) => {
                  const next = cs ?? [];
                  const existing = next.find((c) => c.key === key);
                  if (existing) {
                    return next.map((c) => (c.key === key ? { ...c, channelId: e.target.value } : c));
                  }
                  return [...next, { key, channelId: e.target.value }];
                })
              }
              aria-label={key}
            />
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-4">
        <button className="btn-primary" onClick={save}>{t("admin.save")}</button>
        {saved && <span className="text-sm text-emerald-400">✓ {t("admin.settingsSaved")}</span>}
      </div>
    </div>
  );
}
