export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10 animate-pulse space-y-3 text-center">
        <div className="mx-auto h-4 w-32 rounded bg-stone-200" />
        <div className="mx-auto h-10 w-96 max-w-full rounded bg-stone-200" />
        <div className="mx-auto h-4 w-64 rounded bg-stone-200" />
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 16 }).map((_, index) => (
          <li
            key={index}
            className="h-40 animate-pulse rounded-lg border border-stone-200 bg-white p-4"
          >
            <div className="h-6 w-24 rounded bg-stone-200" />
            <div className="mt-3 h-4 w-full rounded bg-stone-100" />
            <div className="mt-2 h-4 w-3/4 rounded bg-stone-100" />
          </li>
        ))}
      </ul>
    </main>
  );
}
