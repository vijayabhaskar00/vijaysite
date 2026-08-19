import { stats } from "@/content/site";
import StatCounter from "@/components/StatCounter";

const ACCENTS = [
  { bg: "bg-clay-amber-light", text: "text-clay-amber" },
  { bg: "bg-clay-teal-light", text: "text-clay-teal" },
  { bg: "bg-clay-pink-light", text: "text-clay-pink" },
  { bg: "bg-clay-lavender-light", text: "text-clay-lavender" },
];

export default function StatBand() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat, index) => {
        const accent = ACCENTS[index % ACCENTS.length];
        return (
          <div key={stat.label} className={`rounded-[2rem] ${accent.bg} p-6 text-center shadow-clay-raised`}>
            <p className={`font-display text-3xl font-extrabold tabular-nums ${accent.text} sm:text-4xl`}>
              <StatCounter value={stat.value} />
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink/70">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
