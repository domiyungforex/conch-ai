"use client";

const prizes = [
  { place: "1st", amount: "$2,500", medal: "🥇", label: "First Place" },
  { place: "2nd", amount: "$1,500", medal: "🥈", label: "Second Place" },
  { place: "3rd", amount: "$1,000", medal: "🥉", label: "Third Place" },
];

export function PrizeSection() {
  return (
    <section
      className="py-20 md:py-32 px-4 sm:px-6"
      style={{ background: "var(--conch-surface)" }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-[var(--conch-text)] mb-6">
            $5,000 Is Waiting for Great Ideas.
          </h2>
        </div>

        {/* Total prize display */}
        <div className="text-center mb-12">
          <div className="inline-flex flex-col items-center conch-glass rounded-3xl px-12 py-10">
            <span className="text-6xl md:text-8xl font-bold tracking-tight" style={{
              background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #c084fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              $5,000
            </span>
            <span className="text-sm text-[var(--conch-text-muted)] uppercase tracking-widest mt-2">
              Total Prize Fund
            </span>
          </div>
        </div>

        {/* Prize breakdown */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {prizes.map((prize) => (
            <div
              key={prize.place}
              className="conch-glass rounded-2xl p-6 text-center transition-all duration-300 hover:scale-[1.02]"
            >
              <span className="text-4xl block mb-3">{prize.medal}</span>
              <p className="text-xs text-[var(--conch-text-dim)] uppercase tracking-wider mb-1">
                {prize.label}
              </p>
              <p className="text-3xl font-bold text-[var(--conch-text)]">{prize.amount}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-sm text-[var(--conch-text-dim)] max-w-xl mx-auto leading-relaxed">
          Winners are selected according to published challenge criteria and
          judging. This is a skill/creation-based challenge, not a random
          drawing.
        </p>
      </div>
    </section>
  );
}
