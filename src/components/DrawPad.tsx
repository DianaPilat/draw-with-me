import { useRef, useState } from 'react'

interface Props {
  viewBox: string
  /** Same sizing as the lesson canvas so the two line up. */
  size: string
  onClear?: () => void
}

type Point = [number, number]

/** A blank pad for drawing along with the lesson. Strokes are kept as SVG polylines. */
export default function DrawPad({ viewBox, size, onClear }: Props) {
  const [strokes, setStrokes] = useState<Point[][]>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const drawing = useRef(false)
  const [, , w, h] = viewBox.split(' ').map(Number)

  const toPoint = (e: React.PointerEvent): Point => {
    const rect = svgRef.current!.getBoundingClientRect()
    return [((e.clientX - rect.left) / rect.width) * w, ((e.clientY - rect.top) / rect.height) * h]
  }

  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    setStrokes((s) => [...s, [toPoint(e)]])
  }

  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const p = toPoint(e)
    setStrokes((s) => [...s.slice(0, -1), [...s[s.length - 1], p]])
  }

  const onUp = () => {
    drawing.current = false
  }

  return (
    <div className="pad" style={{ width: size }}>
      <svg
        ref={svgRef}
        className="canvas pad-surface"
        viewBox={viewBox}
        style={{ aspectRatio: `${w} / ${h}`, width: '100%' }}
        role="img"
        aria-label="Your drawing"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <g fill="none" stroke="#023047" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
          {strokes.map((pts, i) =>
            pts.length === 1 ? (
              <circle key={i} cx={pts[0][0]} cy={pts[0][1]} r={3} fill="#023047" stroke="none" />
            ) : (
              <polyline key={i} points={pts.map((p) => p.join(',')).join(' ')} />
            ),
          )}
        </g>
      </svg>
      <div className="pad-actions">
        <button className="pill" onClick={() => setStrokes((s) => s.slice(0, -1))}>
          Undo
        </button>
        <button
          className="pill"
          onClick={() => {
            setStrokes([])
            onClear?.()
          }}
        >
          Clear
        </button>
      </div>
    </div>
  )
}
