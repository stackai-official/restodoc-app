import { useState, useRef, useCallback, useEffect } from 'react';
import RoomShape from './RoomShape';

const MIN_ROOM_SIZE = 30;

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function FloorPlanCanvas({
  canvasData,
  onChange,
  tool,
  rooms: dbRooms,
  onLabelRoom,
  onPinTap,
}) {
  const svgRef = useRef(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1000, h: 800 });
  const [selectedId, setSelectedId] = useState(null);

  // Drawing state
  const [drawStart, setDrawStart] = useState(null);
  const [drawCurrent, setDrawCurrent] = useState(null);

  // Pan/zoom state
  const panRef = useRef(null);
  const pinchRef = useRef(null);

  const roomShapes = canvasData.rooms || [];
  const pins = canvasData.pins || [];
  const scale = canvasData.scale?.pixelsPerFoot || 20;

  // Convert screen coords to SVG coords
  const toSvg = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: viewBox.x + ((clientX - rect.left) / rect.width) * viewBox.w,
      y: viewBox.y + ((clientY - rect.top) / rect.height) * viewBox.h,
    };
  }, [viewBox]);

  // ── Touch/mouse handlers ──────────────────────────────────────

  function handlePointerDown(e) {
    if (e.target.closest('[data-interactive]')) return;
    const pt = toSvg(e.clientX, e.clientY);

    if (tool === 'draw') {
      setDrawStart(pt);
      setDrawCurrent(pt);
    } else if (tool === 'select') {
      setSelectedId(null);
    } else if (tool === 'pin') {
      const id = generateId();
      const newPin = { id, readingId: null, x: pt.x, y: pt.y, label: '', value: '' };
      onChange({ ...canvasData, pins: [...pins, newPin] });
    }
  }

  function handlePointerMove(e) {
    if (tool === 'draw' && drawStart) {
      setDrawCurrent(toSvg(e.clientX, e.clientY));
    }
  }

  function handlePointerUp() {
    if (tool === 'draw' && drawStart && drawCurrent) {
      const x = Math.min(drawStart.x, drawCurrent.x);
      const y = Math.min(drawStart.y, drawCurrent.y);
      const width = Math.abs(drawCurrent.x - drawStart.x);
      const height = Math.abs(drawCurrent.y - drawStart.y);

      if (width >= MIN_ROOM_SIZE && height >= MIN_ROOM_SIZE) {
        const id = generateId();
        const newRoom = { id, roomId: null, x, y, width, height, label: '', color: 'none' };
        const updatedRooms = [...roomShapes, newRoom];
        onChange({ ...canvasData, rooms: updatedRooms });

        // Immediately ask for label
        setTimeout(() => onLabelRoom(id, dbRooms), 50);
      }

      setDrawStart(null);
      setDrawCurrent(null);
    }
  }

  // ── Touch gestures (pan + pinch zoom) ─────────────────────────

  function handleTouchStart(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t = e.touches;
      pinchRef.current = {
        dist: Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY),
        midX: (t[0].clientX + t[1].clientX) / 2,
        midY: (t[0].clientY + t[1].clientY) / 2,
        viewBox: { ...viewBox },
      };
    } else if (e.touches.length === 1 && tool === 'select') {
      panRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        viewBox: { ...viewBox },
      };
    }
  }

  function handleTouchMove(e) {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const t = e.touches;
      const newDist = Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);
      const zoomFactor = pinchRef.current.dist / newDist;

      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();

      const midSvgX = pinchRef.current.viewBox.x +
        ((pinchRef.current.midX - rect.left) / rect.width) * pinchRef.current.viewBox.w;
      const midSvgY = pinchRef.current.viewBox.y +
        ((pinchRef.current.midY - rect.top) / rect.height) * pinchRef.current.viewBox.h;

      const newW = Math.max(200, Math.min(4000, pinchRef.current.viewBox.w * zoomFactor));
      const newH = Math.max(160, Math.min(3200, pinchRef.current.viewBox.h * zoomFactor));

      setViewBox({
        x: midSvgX - (newW * (pinchRef.current.midX - rect.left)) / rect.width,
        y: midSvgY - (newH * (pinchRef.current.midY - rect.top)) / rect.height,
        w: newW,
        h: newH,
      });
    } else if (e.touches.length === 1 && panRef.current) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const dx = (e.touches[0].clientX - panRef.current.startX) / rect.width * panRef.current.viewBox.w;
      const dy = (e.touches[0].clientY - panRef.current.startY) / rect.height * panRef.current.viewBox.h;

      setViewBox({
        ...panRef.current.viewBox,
        x: panRef.current.viewBox.x - dx,
        y: panRef.current.viewBox.y - dy,
      });
    }
  }

  function handleTouchEnd(e) {
    if (e.touches.length < 2) pinchRef.current = null;
    if (e.touches.length < 1) panRef.current = null;
  }

  // Mouse wheel zoom
  function handleWheel(e) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = viewBox.x + ((e.clientX - rect.left) / rect.width) * viewBox.w;
    const my = viewBox.y + ((e.clientY - rect.top) / rect.height) * viewBox.h;

    const newW = Math.max(200, Math.min(4000, viewBox.w * factor));
    const newH = Math.max(160, Math.min(3200, viewBox.h * factor));

    setViewBox({
      x: mx - (newW * (e.clientX - rect.left)) / rect.width,
      y: my - (newH * (e.clientY - rect.top)) / rect.height,
      w: newW,
      h: newH,
    });
  }

  // Attach non-passive wheel listener
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  });

  // ── Shape interactions ────────────────────────────────────────

  function handleRoomTap(roomId) {
    if (tool === 'select') {
      setSelectedId(roomId === selectedId ? null : roomId);
    } else if (tool === 'label') {
      onLabelRoom(roomId, dbRooms);
    } else if (tool === 'erase') {
      onChange({
        ...canvasData,
        rooms: roomShapes.filter((r) => r.id !== roomId),
      });
    }
  }

  function handlePinTap(pin) {
    if (tool === 'erase') {
      onChange({
        ...canvasData,
        pins: pins.filter((p) => p.id !== pin.id),
      });
    } else {
      onPinTap(pin);
    }
  }

  // Drawing preview rect
  let previewRect = null;
  if (drawStart && drawCurrent) {
    previewRect = {
      x: Math.min(drawStart.x, drawCurrent.x),
      y: Math.min(drawStart.y, drawCurrent.y),
      width: Math.abs(drawCurrent.x - drawStart.x),
      height: Math.abs(drawCurrent.y - drawStart.y),
    };
  }

  const zoomScale = viewBox.w / 1000;

  return (
    <svg
      ref={svgRef}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
      className="w-full h-full bg-slate-950 touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Grid */}
      <defs>
        <pattern id="grid" width={scale} height={scale} patternUnits="userSpaceOnUse">
          <path
            d={`M ${scale} 0 L 0 0 0 ${scale}`}
            fill="none"
            stroke="#1e293b"
            strokeWidth={0.5}
          />
        </pattern>
      </defs>
      <rect x={viewBox.x - 500} y={viewBox.y - 500} width={viewBox.w + 1000} height={viewBox.h + 1000} fill="url(#grid)" />

      {/* Room shapes */}
      {roomShapes.map((room) => (
        <RoomShape
          key={room.id}
          room={room}
          selected={selectedId === room.id}
          onTap={() => handleRoomTap(room.id)}
          scale={zoomScale}
        />
      ))}

      {/* Drawing preview */}
      {previewRect && (
        <rect
          x={previewRect.x}
          y={previewRect.y}
          width={previewRect.width}
          height={previewRect.height}
          fill="rgba(59, 130, 246, 0.1)"
          stroke="#3b82f6"
          strokeWidth={2 / zoomScale}
          strokeDasharray={`${6 / zoomScale}`}
          rx={4 / zoomScale}
        />
      )}

      {/* Moisture pins */}
      {pins.map((pin) => (
        <g key={pin.id} onClick={() => handlePinTap(pin)} data-interactive style={{ cursor: 'pointer' }}>
          <circle
            cx={pin.x}
            cy={pin.y}
            r={8 / zoomScale}
            fill="#3b82f6"
            stroke="#0f172a"
            strokeWidth={2 / zoomScale}
          />
          {pin.value && (
            <text
              x={pin.x}
              y={pin.y - 14 / zoomScale}
              textAnchor="middle"
              fill="#93c5fd"
              fontSize={10 / zoomScale}
              fontFamily="system-ui"
              fontWeight={600}
              pointerEvents="none"
            >
              {pin.value}%
            </text>
          )}
        </g>
      ))}

      {/* Scale bar */}
      <g transform={`translate(${viewBox.x + viewBox.w - 120 / zoomScale}, ${viewBox.y + viewBox.h - 30 / zoomScale})`}>
        <line x1={0} y1={0} x2={scale * 5} y2={0} stroke="#475569" strokeWidth={2 / zoomScale} />
        <line x1={0} y1={-4 / zoomScale} x2={0} y2={4 / zoomScale} stroke="#475569" strokeWidth={1.5 / zoomScale} />
        <line x1={scale * 5} y1={-4 / zoomScale} x2={scale * 5} y2={4 / zoomScale} stroke="#475569" strokeWidth={1.5 / zoomScale} />
        <text
          x={scale * 2.5}
          y={-8 / zoomScale}
          textAnchor="middle"
          fill="#64748b"
          fontSize={10 / zoomScale}
          fontFamily="system-ui"
        >
          5 ft
        </text>
      </g>
    </svg>
  );
}
