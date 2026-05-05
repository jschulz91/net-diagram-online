# net-diagram-online

**net-diagram-online** is a lightweight, fully client-side web application for creating, editing, and sharing simple network diagrams — no installation, no backend, no account required.

Design relationships between servers, switches, VPN routers, firewalls, PLCs (SPS), and custom devices. Connect specific ports (e.g. `eth`, `X1`, `GE1`), label cables, group elements into zones, and share the result as a single URL or PDF.

## Use it online

A public instance is hosted on GitHub Pages:

**https://jschulz91.github.io/net-diagram-online/**

No need to clone the repository or install dependencies. Open the link and start drawing. All data stays in your browser — nothing is ever uploaded to a server.

> ⚠️ **This is a private hobby project.** There is no guarantee that the hosted instance will remain online indefinitely, that it will be actively maintained, or that any specific feature will be available at any given time. Use at your own risk. For anything critical, export your data regularly as JSON.

---

## Key Features

- **Port-based connections** — every node has named ports with a type (e.g. `eth`, `fiber`, `serial`) and a name (e.g. `X1`, `GE1`). Edges connect specific ports, not just nodes.
- **Node types** — Server, Switch, VPN-Router, Firewall, SPS (PLC), and a fully customizable node type with a free color picker.
- **Zones** — dashed-border rectangles as background regions; label them with a floating name, resize by dragging.
- **Drag & drop** — move nodes freely; snap to 16 px grid.
- **Adjustable edges** — 90° step routing; click any edge to reveal a drag handle that shifts the routing path left or right.
- **Node resizing** — use the M / L / XL size presets or drag the resize handles directly on selected nodes.
- **Duplicate nodes** — copy a node with all its ports via the properties panel.
- **CAD-style title block** — project name, creator, date, version, and description shown as a classic bordered grid in the bottom-right corner of the canvas; included in PDF exports.
- **Shareable URLs** — the entire diagram (compressed with LZ-String) is encoded into the URL hash. Send the link and the recipient sees the exact same diagram.
- **Export** — JSON (lossless, re-importable) and PDF screenshot.

---

## Save vs. Share

| Action | What it does |
|---|---|
| **JSON Export** | Downloads a `.json` file you can import on any device. Best for backups and offline workflows. |
| **JSON Import** | Loads a previously exported `.json` file and replaces the current diagram. |
| **Link teilen** | Compresses the full diagram into the URL hash and copies it to your clipboard. Anyone with the link can open the exact same diagram — no server involved. |
| **PDF Export** | Screenshots the canvas (including the title block, excluding navigation controls) and saves it as a PDF. A **"Raster ausblenden"** checkbox below the button lets you suppress the background grid in the export. |

> **Privacy note:** The share URL contains the entire diagram payload. Do not share links publicly if your diagram contains confidential hostnames, IP addresses, or network topology.

---

## Tech Stack

net-diagram-online is a serverless Single Page Application (SPA) — one `npm run build` produces a fully static `dist/` folder.

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Diagram engine | React Flow 11 |
| State management | Zustand + Immer |
| Styling | Tailwind CSS + plain CSS |
| URL compression | lz-string |
| PDF export | html-to-image + jsPDF |

---

## Running Locally

```bash
git clone https://github.com/jschulz91/net-diagram-online.git
cd net-diagram-online
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build → dist/
```

---

## Data Model

Exported JSON files follow this structure:

```json
{
  "version": "1.0",
  "exportedAt": "2026-04-28T10:00:00.000Z",
  "projectInfo": {
    "name": "Produktionslinie 3",
    "creator": "J. Schulz",
    "date": "2026-04-28",
    "version": "1.2",
    "description": "Netzwerk Segment OT/IT"
  },
  "nodes": [
    {
      "id": "abc123",
      "nodeType": "switch",
      "label": "Core Switch",
      "portSide": "right",
      "ports": [
        { "id": "p1", "type": "eth", "name": "GE1" },
        { "id": "p2", "type": "eth", "name": "GE2" }
      ],
      "position": { "x": 300, "y": 200 }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "sourceNodeId": "abc123",
      "sourcePortId": "p1",
      "targetNodeId": "def456",
      "targetPortId": "p3",
      "label": "10GbE Trunk",
      "routingOffset": 0
    }
  ]
}
```

Valid `nodeType` values: `server` · `switch` · `vpn_router` · `firewall` · `plc` · `zone` · `custom`

---

## License

MIT License — Copyright © 2026 Joshua Schulz

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

This is a private hobby project maintained in spare time. The author makes no commitment to long-term uptime of the hosted instance, ongoing maintenance, or feature stability. Contributions and forks are welcome under the terms of the MIT license.

Created with Claude Opus 4.7