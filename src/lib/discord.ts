import "server-only";
import { db } from "./db";

/**
 * Discord integration layer.
 *
 * The web app never talks to the Discord Gateway directly. It:
 *  1. writes an in-app Notification row (always), and
 *  2. posts an embed to the mapped channel webhook when configured
 *     (SystemSetting `discord.webhooks.<key>` or env DISCORD_WEBHOOK_*).
 *
 * The standalone bot (bot/index.ts) posts to channels via the Gateway using
 * the DiscordChannel mapping table. When neither webhook nor bot is configured,
 * notifications degrade silently to the in-app system — documented dev fallback.
 */

type EmbedField = { name: string; value: string; inline?: boolean };

async function webhookUrl(key: string): Promise<string | null> {
  const envMap: Record<string, string | undefined> = {
    "flight-bookings": process.env.DISCORD_WEBHOOK_BOOKINGS,
    "flight-reports": process.env.DISCORD_WEBHOOK_PIREPS,
    announcements: process.env.DISCORD_WEBHOOK_ANNOUNCEMENTS,
  };
  if (envMap[key]) return envMap[key]!;
  const setting = await db.systemSetting.findUnique({ where: { key: `discord.webhooks.${key}` } });
  return setting?.value || null;
}

export async function postToChannel(
  channelKey: string,
  embed: { title: string; description?: string; color?: number; fields?: EmbedField[]; timestamp?: string }
): Promise<{ delivered: boolean; via: "webhook" | "none" }> {
  try {
    const url = await webhookUrl(channelKey);
    if (!url) return { delivered: false, via: "none" };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{ ...embed, timestamp: embed.timestamp ?? new Date().toISOString() }],
        username: "Meridian AIR Operations",
      }),
      signal: AbortSignal.timeout(8000),
    });
    return { delivered: res.ok, via: "webhook" };
  } catch (e) {
    console.error(`[discord] webhook ${channelKey} failed`, e);
    return { delivered: false, via: "none" };
  }
}

const MRD_BLUE = 0x1769ff;

export async function notifyBookingCreated(b: {
  code: string; pilotId: string; flightNumber: string; aircraft: string;
  origin: string; dest: string; network: string; scheduledAt: Date;
}) {
  await postToChannel("flight-bookings", {
    title: "MERIDIAN AIR — NEW FLIGHT BOOKING",
    color: MRD_BLUE,
    fields: [
      { name: "Booking", value: b.code, inline: true },
      { name: "Pilot", value: b.pilotId, inline: true },
      { name: "Flight", value: b.flightNumber, inline: true },
      { name: "Aircraft", value: b.aircraft, inline: true },
      { name: "Route", value: `${b.origin} → ${b.dest}`, inline: true },
      { name: "Network", value: b.network, inline: true },
      { name: "Status", value: "BOOKED", inline: true },
      { name: "Date (UTC)", value: b.scheduledAt.toISOString().slice(0, 16).replace("T", " ") + "Z", inline: true },
    ],
  });
}

export async function notifyPirepCreated(p: {
  code: string; pilotId: string; flightNumber: string;
  origin: string; dest: string; durationMin: number;
}) {
  await postToChannel("flight-reports", {
    title: "MERIDIAN AIR — FLIGHT REPORT FILED",
    color: MRD_BLUE,
    fields: [
      { name: "PIREP", value: p.code, inline: true },
      { name: "Pilot", value: p.pilotId, inline: true },
      { name: "Flight", value: p.flightNumber, inline: true },
      { name: "Route", value: `${p.origin} → ${p.dest}`, inline: true },
      { name: "Duration", value: `${Math.floor(p.durationMin / 60)}h ${p.durationMin % 60}m`, inline: true },
      { name: "Status", value: "PENDING REVIEW", inline: true },
    ],
  });
}

export async function notifySystem(title: string, description: string) {
  await postToChannel("announcements", { title, description, color: MRD_BLUE });
}
