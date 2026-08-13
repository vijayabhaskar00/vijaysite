import { stats } from "@/content/site";

export default function StatBand() {
  return (
    <div className="border-y-2 border-night bg-night text-bg">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4 sm:px-8">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="font-display text-3xl tabular-nums text-ochre sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-bg/60">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
