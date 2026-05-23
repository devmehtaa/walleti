import { recordNotificationSent } from "@repo/metrics";
import type { NotificationPayload } from "@repo/redis";

let firebaseApp: import("firebase-admin").app.App | null = null;

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  const admin = require("firebase-admin") as typeof import("firebase-admin");
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
  return firebaseApp;
}

export async function sendFcm(
  deviceToken: string,
  notification: NotificationPayload
): Promise<void> {
  const app = getFirebaseApp();

  if (!app) {
    console.log(`[fcm:dev] token=${deviceToken.slice(0, 8)}… ${notification.message}`);
    recordNotificationSent("fcm", "success");
    return;
  }

  try {
    const admin = require("firebase-admin") as typeof import("firebase-admin");
    await admin.messaging().send({
      token: deviceToken,
      notification: {
        title: "Walleti",
        body: notification.message,
      },
      data: {
        type: notification.type,
        userId: String(notification.userId),
      },
    });
    recordNotificationSent("fcm", "success");
  } catch (error) {
    console.error("[fcm]", error);
    recordNotificationSent("fcm", "error");
    throw error;
  }
}
