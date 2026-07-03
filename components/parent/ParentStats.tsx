
export default function ParentStats({
  childrenCount,
  totalXp,
  completedPrograms,
  totalMinutes,
}: {
  childrenCount: number;
  totalXp: number;
  completedPrograms: number;
  totalMinutes: number;
}) {
  function formatDurationFromMinutes(minutes: number) {
    const totalSeconds = Math.floor((minutes || 0) * 60);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);

    if (h > 0) return `${h} ساعة ${m} دقيقة`;
    return `${m} دقيقة`;
  }

  const learningTime = formatDurationFromMinutes(totalMinutes);

  const cards = [
    { icon: "👨‍👩‍👧", value: childrenCount, label: "عدد الأبناء" },
    { icon: "⚡", value: totalXp, label: "إجمالي XP" },
    { icon: "📚", value: completedPrograms, label: "برامج مكتملة" },
    { icon: "⏱️", value: learningTime, label: "وقت التعلم" },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[2rem] bg-white/95 p-6 shadow-[0_18px_45px_rgba(62,87,120,.08)]"
        >
          <div className="text-5xl">{card.icon}</div>
          <div className="mt-4 text-4xl font-black text-[var(--rashid-color-0b4d6b)]">
            {card.value}
          </div>
          <div className="mt-2 font-bold text-[var(--rashid-color-6e7a99)]">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
