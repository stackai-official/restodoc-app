// SVG room rectangle with centered label and moisture-based fill color

const STATUS_FILLS = {
  dry:    { fill: 'rgba(34, 197, 94, 0.15)', stroke: '#22c55e' },
  progress: { fill: 'rgba(234, 179, 8, 0.15)', stroke: '#eab308' },
  wet:    { fill: 'rgba(239, 68, 68, 0.15)', stroke: '#ef4444' },
  none:   { fill: 'rgba(148, 163, 184, 0.08)', stroke: '#475569' },
};

export default function RoomShape({
  room,
  selected,
  onTap,
  scale = 1,
}) {
  const { x, y, width, height, label, color = 'none' } = room;
  const style = STATUS_FILLS[color] || STATUS_FILLS.none;

  // Font size scales with room but has min/max
  const fontSize = Math.max(10, Math.min(14, Math.min(width, height) * 0.18)) / scale;

  return (
    <g onClick={onTap} style={{ cursor: 'pointer' }}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={style.fill}
        stroke={selected ? '#3b82f6' : style.stroke}
        strokeWidth={selected ? 2.5 / scale : 1.5 / scale}
        rx={4 / scale}
      />
      {label && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#e2e8f0"
          fontSize={fontSize}
          fontFamily="system-ui, sans-serif"
          fontWeight={500}
          pointerEvents="none"
        >
          {label}
        </text>
      )}
    </g>
  );
}
