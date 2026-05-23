"use server";

import { recordFailedLogin } from "@repo/metrics";

export async function recordFailedLoginAction(reason: string) {
  recordFailedLogin(reason);
}
