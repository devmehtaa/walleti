"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-xl font-semibold text-slate-800">Something went wrong</h2>
      <p className="max-w-md text-center text-slate-600">{error.message}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-[#6a51a6] px-4 py-2 text-white hover:bg-[#5a448f]"
      >
        Try again
      </button>
    </div>
  );
}
