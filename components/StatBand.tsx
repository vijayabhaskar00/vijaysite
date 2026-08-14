import { stats } from "@/content/site";
import StatCounter from "@/components/StatCounter";

export default function StatBand() {
  return (
    <div className="border-y border-line">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4 sm:px-8">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="font-display text-3xl font-bold tabular-nums text-amber sm:text-4xl">
              <StatCounter value={stat.value} />
            </p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-mute">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
