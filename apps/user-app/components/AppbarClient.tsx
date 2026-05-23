"use client"
import { signOut, useSession } from "next-auth/react";
import { Appbar } from "@repo/ui/appbar";
import { useRouter } from "next/navigation";

export function AppbarClient() {
  const session = useSession();
  const router = useRouter();

  return (
   <div>
      <Appbar onSignin={() => router.push("/login")} onSignout={async () => {
        await signOut()
        router.push("/login")
      }} user={session.data?.user} />
   </div>
  );
}
