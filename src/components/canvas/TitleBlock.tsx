import type { ProjectInfo } from '../../types/diagram'

interface Props {
  info: ProjectInfo
}

export function TitleBlock({ info }: Props) {
  const hasAnyContent =
    info.name || info.creator || info.date || info.version || info.description

  return (
    <div className="title-block">
      {/* Project name row */}
      <div className="tb-name-row">
        {info.name || <span className="tb-placeholder">Projektname</span>}
      </div>

      {/* Meta row: creator / date / version */}
      <div className="tb-meta-row">
        <div className="tb-cell">
          <div className="tb-label">Ersteller</div>
          <div className="tb-value">{info.creator || <span className="tb-placeholder">—</span>}</div>
        </div>
        <div className="tb-cell">
          <div className="tb-label">Datum</div>
          <div className="tb-value">{info.date || <span className="tb-placeholder">—</span>}</div>
        </div>
        <div className="tb-cell tb-cell-last">
          <div className="tb-label">Version</div>
          <div className="tb-value">{info.version || <span className="tb-placeholder">—</span>}</div>
        </div>
      </div>

      {/* Description row */}
      <div className="tb-desc-row">
        <div className="tb-label">Beschreibung</div>
        <div className="tb-value tb-desc-value">
          {info.description || (!hasAnyContent && <span className="tb-placeholder">Keine Beschreibung</span>)}
        </div>
      </div>
    </div>
  )
}
