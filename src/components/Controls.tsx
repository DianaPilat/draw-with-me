interface Props {
  playing: boolean
  finished: boolean
  stepMode: boolean
  onPlay: () => void
  onPause: () => void
  onReplay: () => void
  onNext: () => void
  onStepMode: (on: boolean) => void
}

export default function Controls(p: Props) {
  return (
    <div className="controls">
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
        ⏭
      </button>
      <label className="toggle">
        <input
          type="checkbox"
          checked={p.stepMode}
          onChange={(e) => p.onStepMode(e.target.checked)}
        />
        One step at a time
      </label>
    </div>
  )
}
