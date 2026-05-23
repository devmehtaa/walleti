import { recordNotificationSent } from "@repo/metrics";
import type { NotificationPayload } from "@repo/redis";

export async function sendSms(
  phone: string,
  notification: NotificationPayload
): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    console.log(`[sms:dev] to=${phone} ${notification.message}`);
    recordNotificationSent("sms", "success");
    return;
  }

  try {
    const twilio = await import("twilio");
    const client = twilio.default(accountSid, authToken);
    await client.messages.create({
      body: notification.message,
      from,
      to: phone,
    });
    recordNotificationSent("sms", "success");
  } catch (error) {
    console.error("[sms]", error);
    recordNotificationSent("sms", "error");
    throw error;
  }
}
