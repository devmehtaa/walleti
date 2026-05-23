import prisma from "@repo/db/client";
import type { NotificationPayload } from "@repo/redis";
import { sendEmail } from "./email";
import { sendFcm } from "./fcm";
import { sendSms } from "./sms";

export async function deliverNotification(
  notification: NotificationPayload
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: notification.userId },
    select: { email: true, number: true, name: true },
  });

  if (!user) {
    console.warn("[notify] user not found", notification.userId);
    return;
  }

  const channels: Promise<void>[] = [];

  if (user.email && user.email.includes("@")) {
    channels.push(sendEmail(user.email, notification));
  }

  if (user.number) {
    channels.push(sendSms(user.number, notification));
  }

  const fcmToken = process.env[`FCM_TOKEN_USER_${notification.userId}`];
  if (fcmToken) {
    channels.push(sendFcm(fcmToken, notification));
  }

  if (channels.length === 0) {
    console.log("[notify]", notification);
  } else {
    await Promise.allSettled(channels);
  }
}
