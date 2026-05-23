import nodemailer from "nodemailer";
import { recordNotificationSent } from "@repo/metrics";
import type { NotificationPayload } from "@repo/redis";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: false,
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

export async function sendEmail(
  to: string,
  notification: NotificationPayload
): Promise<void> {
  const from = process.env.SMTP_FROM ?? "walleti@localhost";

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `Walleti: ${notification.type}`,
      text: notification.message,
      html: `<p>${notification.message}</p><p><small>${notification.createdAt}</small></p>`,
    });
    recordNotificationSent("email", "success");
  } catch (error) {
    console.error("[email]", error);
    recordNotificationSent("email", "error");
    throw error;
  }
}
