import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineString } from "firebase-functions/params";
import * as admin from "firebase-admin";

admin.initializeApp();

const DISCORD_WEBHOOK_URL = defineString("DISCORD_WEBHOOK_URL", { default: "" });

interface BookingData {
  stationId: string;
  date: string;
  timeSlot: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
}

async function sendDiscordEmbed(embed: object): Promise<boolean> {
  const url = DISCORD_WEBHOOK_URL.value();
  if (!url) {
    console.error("DISCORD_WEBHOOK_URL not configured");
    return false;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    return response.ok || response.status === 204;
  } catch (error) {
    console.error("Failed to send Discord notification:", error);
    return false;
  }
}

export const onBookingCreated = onDocumentCreated(
  "bookings/{bookingId}",
  async (event) => {
    const booking = event.data?.data() as BookingData | undefined;
    if (!booking) return;

    // Look up station name from Firestore
    let stationName = booking.stationId;
    try {
      const stationDoc = await admin.firestore().doc(`stations/${booking.stationId}`).get();
      if (stationDoc.exists) {
        stationName = stationDoc.data()?.name ?? stationName;
      }
    } catch {
      // Use stationId as fallback
    }

    const embed = {
      title: "New Booking Request",
      color: 0xc0392b,
      fields: [
        { name: "Customer", value: booking.customerName, inline: true },
        { name: "Phone", value: booking.customerPhone, inline: true },
        { name: "Email", value: booking.customerEmail || "Not provided", inline: true },
        { name: "Station", value: stationName, inline: true },
        { name: "Date", value: booking.date, inline: true },
        { name: "Time Slot", value: booking.timeSlot, inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "KaiGaming Booking System" },
    };

    const sent = await sendDiscordEmbed(embed);

    // Notification delivery is not confirmation; the admin must confirm manually.
    if (event.data?.ref) {
      await event.data.ref.update({
        status: "pending",
        discordFailed: !sent,
      });
    }
  }
);
