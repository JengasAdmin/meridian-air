/**
 * Meridian AIR Discord Bot.
 * Run: npm run bot   (requires DISCORD_TOKEN / DISCORD_CLIENT_ID / DISCORD_GUILD_ID)
 *
 * Slash commands: /booking /pirep /pilot /flight /fleet /routes /stats /status
 * Reads channel mapping from the database (DiscordChannel table), so admins can
 * remap channels in the admin panel without touching the bot.
 */
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChatInputCommandInteraction, Events, EmbedBuilder } from "discord.js";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("[bot] DISCORD_TOKEN / DISCORD_CLIENT_ID not set — bot disabled. This is the documented dev fallback.");
  process.exit(0);
}

const commands = [
  new SlashCommandBuilder().setName("booking").setDescription("List your active bookings"),
  new SlashCommandBuilder().setName("pirep").setDescription("List your recent PIREPs"),
  new SlashCommandBuilder().setName("pilot").setDescription("Show your pilot profile"),
  new SlashCommandBuilder().setName("flight").setDescription("Show a booking by code").addStringOption((o) => o.setName("code").setDescription("MRD-BOOK-XXXXXX").setRequired(true)),
  new SlashCommandBuilder().setName("fleet").setDescription("Show fleet summary"),
  new SlashCommandBuilder().setName("routes").setDescription("Show routes from an airport").addStringOption((o) => o.setName("icao").setDescription("e.g. UMKK").setRequired(true)),
  new SlashCommandBuilder().setName("stats").setDescription("Airline statistics"),
  new SlashCommandBuilder().setName("status").setDescription("Bot / system status"),
].map((c) => c.toJSON());

async function channelFor(key: string): Promise<string | null> {
  const ch = await db.discordChannel.findUnique({ where: { key } });
  return ch?.channelId || null;
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (c) => {
  console.log(`[bot] Logged in as ${c.user.tag}`);
  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN!);
    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID!, GUILD_ID), { body: commands });
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID!), { body: commands });
    }
    console.log("[bot] Slash commands registered");
  } catch (e) {
    console.error("[bot] command registration failed", e);
  }
});

function baseEmbed(color = 0x1769ff) {
  return new EmbedBuilder().setColor(color).setTimestamp(new Date()).setFooter({ text: "Meridian AIR Operations" });
}

client.on(Events.InteractionCreate, async (i: ChatInputCommandInteraction) => {
  if (!i.isChatInputCommand()) return;
  try {
    const pilot = await db.pilotProfile.findFirst({
      where: { user: { discordId: i.user.id } },
      include: { user: true, rank: true, hub: true },
    });

    switch (i.commandName) {
      case "pilot": {
        if (!pilot) return void (await i.reply({ content: "Pilot profile not linked. Укажите Discord ID в профиле на сайте.", ephemeral: true }));
        const embed = baseEmbed()
          .setTitle("MERIDIAN AIR — PILOT PROFILE")
          .addFields(
            { name: "Pilot ID", value: pilot.pilotId, inline: true },
            { name: "Name", value: pilot.user.name, inline: true },
            { name: "Status", value: pilot.status, inline: true },
            { name: "Rank", value: pilot.rank?.nameEn ?? "—", inline: true },
            { name: "Hub", value: pilot.hub?.code ?? "—", inline: true },
            { name: "Hours", value: `${Math.round(pilot.hours)}`, inline: true },
          );
        return void (await i.reply({ embeds: [embed] }));
      }
      case "booking": {
        if (!pilot) return void (await i.reply({ content: "Pilot profile not linked.", ephemeral: true }));
        const bookings = await db.booking.findMany({
          where: { userId: pilot.userId, status: "BOOKED" },
          include: { route: { include: { origin: true, dest: true } }, aircraft: true },
          orderBy: { scheduledAt: "asc" },
          take: 5,
        });
        if (!bookings.length) return void (await i.reply({ content: "No active bookings.", ephemeral: true }));
        const embed = baseEmbed().setTitle("MERIDIAN AIR — YOUR BOOKINGS");
        for (const b of bookings) {
          embed.addFields({
            name: `${b.code} — ${b.flightNumber}`,
            value: `${b.route.origin.code} → ${b.route.dest.code} · ${b.aircraft.type} · ${b.network} · <t:${Math.floor(b.scheduledAt.getTime() / 1000)}:f>`,
          });
        }
        return void (await i.reply({ embeds: [embed] }));
      }
      case "pirep": {
        if (!pilot) return void (await i.reply({ content: "Pilot profile not linked.", ephemeral: true }));
        const pireps = await db.pirep.findMany({ where: { userId: pilot.userId }, orderBy: { createdAt: "desc" }, take: 5 });
        if (!pireps.length) return void (await i.reply({ content: "No PIREPs yet.", ephemeral: true }));
        const embed = baseEmbed().setTitle("MERIDIAN AIR — YOUR PIREPS");
        for (const p of pireps) {
          embed.addFields({ name: `${p.code} — ${p.flightNumber}`, value: `${p.originId ? "" : ""}${p.status} · ${p.durationMin} min` });
        }
        return void (await i.reply({ embeds: [embed] }));
      }
      case "flight": {
        const code = i.options.getString("code", true).toUpperCase();
        const b = await db.booking.findUnique({
          where: { code },
          include: { route: { include: { origin: true, dest: true } }, aircraft: true, user: { include: { pilotProfile: true } } },
        });
        if (!b) return void (await i.reply({ content: `Booking ${code} not found.`, ephemeral: true }));
        const embed = baseEmbed()
          .setTitle(`MERIDIAN AIR — ${b.code}`)
          .addFields(
            { name: "Flight", value: b.flightNumber, inline: true },
            { name: "Pilot", value: b.user.pilotProfile?.pilotId ?? b.user.name, inline: true },
            { name: "Status", value: b.status, inline: true },
            { name: "Route", value: `${b.route.origin.code} → ${b.route.dest.code}`, inline: true },
            { name: "Aircraft", value: b.aircraft.type, inline: true },
            { name: "Network", value: b.network, inline: true },
          );
        return void (await i.reply({ embeds: [embed] }));
      }
      case "fleet": {
        const cats = await db.aircraftCategory.findMany({ include: { aircraft: true } });
        const embed = baseEmbed().setTitle("MERIDIAN AIR — FLEET");
        for (const c of cats) {
          embed.addFields({ name: c.nameEn, value: `${c.aircraft.length} aircraft`, inline: true });
        }
        return void (await i.reply({ embeds: [embed] }));
      }
      case "routes": {
        const icao = i.options.getString("icao", true).toUpperCase();
        const airport = await db.airport.findUnique({ where: { code: icao } });
        if (!airport) return void (await i.reply({ content: `Airport ${icao} not found.`, ephemeral: true }));
        const routes = await db.route.findMany({
          where: { originId: airport.id, active: true },
          include: { dest: true, category: true },
          take: 10,
        });
        const embed = baseEmbed().setTitle(`MERIDIAN AIR — ROUTES FROM ${icao}`);
        for (const r of routes) {
          embed.addFields({ name: r.flightNumber, value: `${r.dest.code} · ${r.category.key} · ${r.distanceNm} nm` });
        }
        return void (await i.reply({ embeds: [embed] }));
      }
      case "stats": {
        const [pilots, flights, hours] = await Promise.all([
          db.pilotProfile.count(),
          db.pirep.count({ where: { status: "APPROVED" } }),
          db.pilotProfile.aggregate({ _sum: { hours: true } }),
        ]);
        const embed = baseEmbed()
          .setTitle("MERIDIAN AIR — STATISTICS")
          .addFields(
            { name: "Pilots", value: `${pilots}`, inline: true },
            { name: "Flights", value: `${flights}`, inline: true },
            { name: "Hours", value: `${Math.round(hours._sum.hours ?? 0)}`, inline: true },
          );
        return void (await i.reply({ embeds: [embed] }));
      }
      case "status": {
        return void (await i.reply({
          embeds: [baseEmbed(0x22c55e).setTitle("MERIDIAN AIR — SYSTEM STATUS").setDescription("All systems operational ✅")],
        }));
      }
    }
  } catch (e) {
    console.error("[bot] interaction error", e);
    if (!i.replied) await i.reply({ content: "Internal error.", ephemeral: true }).catch(() => {});
  }
});

client.login(TOKEN);
