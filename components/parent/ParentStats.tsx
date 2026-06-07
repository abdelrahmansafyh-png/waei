
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
  const hours = Math.round((totalMinutes / 60) * 10) / 10;

  const cards = [
    { icon: "👨‍👩‍👧", value: childrenCount, label: "عدد الأبناء" },
    { icon: "⚡", value: totalXp, label: "إجمالي XP" },
    { icon: "📚", value: completedPrograms, label: "برامج مكتملة" },
    { icon: "⏱️", value: hours, label: "ساعات التعلم" },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[2rem] bg-white/95 p-6 shadow-[0_18px_45px_rgba(62,87,120,.08)]"
        >
          <div className="text-5xl">{card.icon}</div>
          <div className="mt-4 text-4xl font-black text-[#0B4D6B]">
            {card.value}
          </div>
          <div className="mt-2 font-bold text-[#6E7A99]">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
