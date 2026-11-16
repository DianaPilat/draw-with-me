interface Props {
  playing: boolean
  finished: boolean
  stepMode: boolean
  drawAlong: boolean
  onDrawAlong: (on: boolean) => void
  onPlay: () => void
  onPause: () => void
  onReplay: () => void
  onNext: () => void
  onStepMode: (on: boolean) => void
}

export default function Controls(p: Props) {
  return (
    <div className="controls">
      <div className="controls-buttons">
        <button className="btn" onClick={p.onReplay} aria-label="Start over">
          ↺
        </button>
        {p.playing ? (
          <button className="btn btn-main" onClick={p.onPause} aria-label="Pause">
            ❚❚
          </button>
        ) : (
          <button
            className="btn btn-main"
            onClick={p.finished ? p.onReplay : p.onPlay}
            aria-label="Play"
          >
            ▶
          </button>
        )}
        <button className="btn" onClick={p.onNext} aria-label="Next step">
          <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
            <path d="M4 5v14l11-7z" />
            <rect x="17" y="5" width="3" height="14" />
          </svg>
        </button>
      </div>
      <div className="controls-toggles">
        <label className="toggle">
          <input
            type="checkbox"
            checked={!p.stepMode}
            onChange={(e) => p.onStepMode(!e.target.checked)}
          />
          Play all at once
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={p.drawAlong}
            onChange={(e) => p.onDrawAlong(e.target.checked)}
          />
          Draw along
        </label>
      </div>
    </div>
  )
}
