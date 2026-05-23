"use client"
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { useState } from "react";
import { TextInput } from "@repo/ui/textinput";
import { createStripeCheckoutSession } from "../app/lib/actions/createStripeCheckout";

export const AddMoney = () => {
    const [amount, setAmount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return <Card title="Add Money">
    <div className="w-full">
        <TextInput label={"Amount (INR)"} placeholder={"e.g. 100"} onChange={(val) => {
            setAmount(Number(val));
            setError(null);
        }} />
        <p className="text-sm text-slate-600 pt-2">
            Pay securely with Stripe. Your wallet balance updates after payment succeeds.
        </p>
        {error ? (
            <p className="text-sm text-red-600 pt-2">{error}</p>
        ) : null}
        <div className="flex justify-center pt-4">
            <Button onClick={async () => {
                setLoading(true);
                setError(null);
                const result = await createStripeCheckoutSession(amount);
                setLoading(false);

                if (result.url) {
                    window.location.href = result.url;
                    return;
                }

                setError(result.error || "Could not start checkout");
            }}>
            {loading ? "Redirecting to Stripe…" : "Pay with Stripe"}
            </Button>
        </div>
    </div>
</Card>
}
