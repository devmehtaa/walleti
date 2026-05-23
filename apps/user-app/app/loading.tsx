export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#ebe6e6]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#6a51a6] border-t-transparent" />
        <p className="text-slate-600">Loading Walleti…</p>
      </div>
    </div>
  );
}
