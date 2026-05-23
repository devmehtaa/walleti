"use client"

export function PaymentStatusBanner({
    success,
    canceled,
}: {
    success?: boolean;
    canceled?: boolean;
}) {
    if (success) {
        return (
            <div className="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-green-800">
                Payment successful. Your wallet balance will update shortly.
            </div>
        );
    }

    if (canceled) {
        return (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
                Payment canceled. No money was added to your wallet.
            </div>
        );
    }

    return null;
}
