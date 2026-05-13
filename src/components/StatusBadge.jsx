const STATUS_STYLES = {
  active:   'bg-emerald-500/15 text-emerald-400',
  drying:   'bg-amber-500/15 text-amber-400',
  complete: 'bg-slate-500/15 text-slate-400',
};

const LOSS_STYLES = {
  water: 'bg-blue-500/15 text-blue-400',
  fire:  'bg-orange-500/15 text-orange-400',
  mold:  'bg-green-500/15 text-green-400',
  other: 'bg-slate-500/15 text-slate-400',
};

export function StatusBadge({ status, onClick }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.active;
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full capitalize ${cls} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {status}
    </Tag>
  );
}

export function LossTypeBadge({ lossType }) {
  const cls = LOSS_STYLES[lossType] || LOSS_STYLES.other;
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${cls}`}>
      {lossType}
    </span>
  );
}
