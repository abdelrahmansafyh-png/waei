import type { Content } from "./types";

type SequentialActivityCardProps = {
  game: Content;
  index: number;
  done: boolean;
  active: boolean;
  unlocked: boolean;
  cover: string;
  icon: string;
  title: string;
  itemLabel: string;
  doneStatus: string;
  activeStatus: string;
  openStatus: string;
  lockedStatus: string;
  className?: string;
  onClick: () => void;
};

export function SequentialActivityCard({
  game,
  index,
  done,
  active,
  unlocked,
  cover,
  icon,
  title,
  itemLabel,
  doneStatus,
  activeStatus,
  openStatus,
  lockedStatus,
  className = "",
  onClick,
}: SequentialActivityCardProps) {
  return (
    <button
      key={game.id}
      type="button"
      onClick={onClick}
      className={`activity-card ${className} ${active ? "active" : ""} ${!unlocked ? "locked" : ""}`}
    >
      <div className="activity-cover" style={{ background: cover }}>
        <span className={`activity-status ${done ? "done" : !unlocked ? "lock" : ""}`}>
          {done ? "✓" : !unlocked ? "🔒" : index + 1}
        </span>
        <span className="activity-status">{icon}</span>
      </div>

      <div className="activity-body">
        <div className="activity-title">{title}</div>
        <div className="activity-meta">
          <span>{done ? doneStatus : active ? activeStatus : unlocked ? openStatus : lockedStatus}</span>
          <span>{itemLabel} {index + 1}</span>
        </div>
      </div>
    </button>
  );
}
