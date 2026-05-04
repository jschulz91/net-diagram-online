import { useRef, useState } from 'react'
import { useDiagramStore } from '../../store/diagramStore'
import { NODE_ICONS, NODE_COLORS } from '../../constants/nodeDefinitions'
import type { NodeType } from '../../types/diagram'
import { toJSON, fromJSON, encodeToUrl } from '../../utils/serialization'
import { toJpeg } from 'html-to-image'
import { jsPDF } from 'jspdf'

const NODE_TYPES: NodeType[] = ['server', 'switch', 'vpn_router', 'firewall', 'plc', 'custom']
const NODE_NAMES: Record<NodeType, string> = {
  server: 'Server',
  switch: 'Switch',
  vpn_router: 'VPN-Router',
  firewall: 'Firewall',
  plc: 'SPS',
  zone: 'Zone',
  rack: 'Server Rack',
  custom: 'Benutzerdefiniert',
}

export function Toolbar() {
  const addNode = useDiagramStore((s) => s.addNode)
  const nodes = useDiagramStore((s) => s.nodes)
  const edges = useDiagramStore((s) => s.edges)
  const projectInfo = useDiagramStore((s) => s.projectInfo)
  const loadDiagram = useDiagramStore((s) => s.loadDiagram)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [pdfHideGrid, setPdfHideGrid] = useState(false)

  function handleShare() {
    const diagram = toJSON(nodes, edges, projectInfo)
    const url = encodeToUrl(diagram)
    window.history.replaceState(null, '', url)
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    })
  }

  async function handleExportPdf() {
    const canvas = document.querySelector('.react-flow') as HTMLElement | null
    if (!canvas) return
    try {
      const { width, height } = canvas.getBoundingClientRect()
      const dataUrl = await toJpeg(canvas, {
        pixelRatio: 1.5,
        quality: 0.88,
        backgroundColor: '#f1f5f9',
        filter: (node) => {
          if (node.classList?.contains('no-print')) return false
          if (pdfHideGrid && node.classList?.contains('react-flow__background')) return false
          return true
        },
      })
      const pdf = new jsPDF({ orientation: width > height ? 'l' : 'p', unit: 'px', format: [width, height] })
      pdf.addImage(dataUrl, 'JPEG', 0, 0, width, height)
      pdf.save(`netzwerkdiagramm-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (e) {
      alert(`PDF-Export fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  function handleExport() {
    const diagram = toJSON(nodes, edges, projectInfo)
    const blob = new Blob([JSON.stringify(diagram, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `netzwerkdiagramm-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string)
        const diagram = fromJSON(raw)
        if (nodes.length > 0 && !confirm('Das aktuelle Diagramm wird ersetzt. Fortfahren?')) return
        loadDiagram(diagram)
      } catch (err) {
        alert(`Import fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    reader.readAsText(file)
    // reset so same file can be re-imported
    e.target.value = ''
  }

  return (
    <div className="toolbar">
      <div className="toolbar-title">Elemente</div>

      <div className="toolbar-section">
        {NODE_TYPES.map((type) => (
          <button
            key={type}
            className="add-node-btn"
            style={{ borderLeftColor: NODE_COLORS[type] }}
            onClick={() => addNode(type)}
          >
            <span className="btn-icon">{NODE_ICONS[type]}</span>
            <span>{NODE_NAMES[type]}</span>
          </button>
        ))}
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-title">Bereiche</div>
      <div className="toolbar-section">
        <button
          className="add-node-btn"
          style={{ borderLeftColor: '#94a3b8', borderStyle: 'dashed' }}
          onClick={() => addNode('zone')}
        >
          <span className="btn-icon">▭</span>
          <span>Zone</span>
        </button>
        <button
          className="add-node-btn"
          style={{ borderLeftColor: '#1e293b' }}
          onClick={() => addNode('rack')}
        >
          <span className="btn-icon">▤</span>
          <span>Server Rack</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <button className="action-btn share-btn" onClick={handleShare}>
          {shareCopied ? '✓ Link kopiert' : '⬡ Link teilen'}
        </button>
        <button className="action-btn export-btn" onClick={handleExport}>
          ↓ JSON Export
        </button>
        <button className="action-btn import-btn" onClick={handleImportClick}>
          ↑ JSON Import
        </button>
        <button className="action-btn pdf-btn" onClick={handleExportPdf}>
          ↓ PDF Export
        </button>
        <label className="pdf-option-label">
          <input
            type="checkbox"
            checked={pdfHideGrid}
            onChange={(e) => setPdfHideGrid(e.target.checked)}
          />
          Raster ausblenden
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-hint">
        <p>Verbinden: Handle ziehen</p>
        <p>Löschen: Element wählen + Entf</p>
      </div>
    </div>
  )
}
