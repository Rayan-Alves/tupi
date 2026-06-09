/**
 * PagedEditor — Google Docs-inspired A4 paged rich-text editor
 *
 * Architecture:
 *  Each page = white 794×1123 box with overflow:hidden.
 *  Inside each page, a content wrapper is absolutely positioned
 *  96px from each edge (1-inch / 2.54 cm margins — Google Docs default).
 *  The editor fills the content wrapper via flex:1.
 *  When editor.scrollHeight > editor.clientHeight, overflowing blocks
 *  are moved to the next page. Single-block overflow is split at the
 *  visual line using caretRangeFromPoint.
 */
import { useRef, useEffect, useState, useCallback } from 'react'

// ── A4 @ 96 dpi ───────────────────────────────────────────────────────────
const PAGE_W   = 794
const PAGE_H   = 1123
const MARGIN_V = 96       // 1 inch = 96px @ 96 dpi
const MARGIN_H = 96
const GAP      = 8        // gray gap between pages (like Google Docs)
const BG       = '#F8F9FA' // canvas background

const FONTS = [
  'Arial','Calibri','Cambria','Comic Sans MS','Courier New',
  'Georgia','Helvetica','Impact','Lucida Console',
  'Palatino Linotype','Tahoma','Times New Roman',
  'Trebuchet MS','Verdana',
]

// ── CSS ───────────────────────────────────────────────────────────────────
const STYLE_ID = 'gd-editor-css'
function injectCSS() {
  let el = document.getElementById(STYLE_ID)
  if (!el) { el = document.createElement('style'); el.id = STYLE_ID; document.head.appendChild(el) }
  el.textContent = `
.gd-shell { background:${BG}; min-height:100vh; }

/* ── Toolbar ── */
.gd-toolbar {
  position:sticky; top:0; z-index:30;
  background:#EDF2FA; border-bottom:1px solid #DADCE0;
  display:flex; align-items:center; flex-wrap:wrap; gap:1px;
  padding:3px 10px; min-height:40px;
  font-family:Arial,sans-serif; user-select:none;
}
.gd-tb-btn {
  width:30px; height:30px; display:inline-flex; align-items:center; justify-content:center;
  border:none; background:transparent; border-radius:4px; cursor:pointer;
  color:#444746; font-size:13px; transition:background .08s; flex-shrink:0;
  font-family:inherit; padding:0; position:relative;
}
.gd-tb-btn:hover { background:#D3E3FD; }
.gd-tb-btn.on   { background:#C2E7FF; color:#001D35; }
.gd-tb-btn svg  { display:block; }
.gd-tb-select {
  height:30px; border:1px solid #C4C7C5; background:#fff; border-radius:4px;
  font-size:13px; color:#1F1F1F; padding:0 22px 0 8px; cursor:pointer;
  font-family:inherit; outline:none; flex-shrink:0; appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23444746' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 6px center;
}
.gd-tb-select:hover { border-color:#1F1F1F; }
.gd-tb-sep { width:1px; height:22px; background:#C4C7C5; margin:0 4px; flex-shrink:0; }
.gd-tb-size { display:flex; align-items:center; gap:0; }
.gd-tb-size input {
  width:36px; height:30px; border:1px solid #C4C7C5; background:#fff;
  text-align:center; font-size:13px; color:#1F1F1F; outline:none;
  font-family:inherit; border-radius:4px; padding:0;
  -moz-appearance:textfield;
}
.gd-tb-size input::-webkit-outer-spin-button,
.gd-tb-size input::-webkit-inner-spin-button { -webkit-appearance:none; }
.gd-tb-size input:focus { border-color:#1967D2; }
.gd-color-wrap { position:relative; }
.gd-color-wrap input[type=color] {
  position:absolute; inset:0; opacity:0; cursor:pointer;
  width:100%; height:100%; border:none; padding:0;
}

/* dropdowns */
.gd-dd-wrap { position:relative; display:inline-flex; }
.gd-dropdown {
  position:absolute; top:calc(100% + 4px); left:50%; transform:translateX(-50%);
  z-index:40; background:#fff; border:1px solid #DADCE0; border-radius:8px;
  box-shadow:0 2px 12px rgba(0,0,0,.15); padding:4px 0; min-width:120px;
}
.gd-dropdown button {
  display:block; width:100%; text-align:left; padding:6px 16px;
  border:none; background:transparent; cursor:pointer; font-size:13px;
  color:#1F1F1F; font-family:inherit; white-space:nowrap;
}
.gd-dropdown button:hover { background:#F1F3F4; }

/* link popover */
.gd-link-pop {
  position:absolute; top:calc(100% + 4px); left:0; z-index:40;
  background:#fff; border:1px solid #DADCE0; border-radius:8px;
  box-shadow:0 4px 14px rgba(0,0,0,.15); padding:10px 12px;
  display:flex; gap:6px; align-items:center; min-width:280px;
}
.gd-link-pop input {
  flex:1; border:1px solid #DADCE0; border-radius:4px; padding:6px 10px;
  font-size:13px; outline:none; font-family:inherit; color:#1F1F1F;
}
.gd-link-pop input:focus { border-color:#1967D2; }
.gd-link-pop button {
  padding:6px 14px; border-radius:4px; border:none; cursor:pointer;
  font-size:13px; font-weight:600; font-family:inherit;
}

/* table picker */
.gd-table-picker {
  position:absolute; top:calc(100% + 4px); left:50%; transform:translateX(-50%);
  z-index:40; background:#fff; border:1px solid #DADCE0; border-radius:8px;
  box-shadow:0 2px 12px rgba(0,0,0,.15); padding:10px;
}
.gd-table-grid { display:grid; grid-template-columns:repeat(6,22px); gap:2px; }
.gd-table-cell {
  width:22px; height:22px; border:1px solid #DADCE0; border-radius:2px;
  cursor:pointer; transition:background .06s,border-color .06s;
}
.gd-table-cell.on { background:#C2E7FF; border-color:#1967D2; }
.gd-table-label {
  text-align:center; margin-top:6px; font-size:12px; color:#5F6368;
  font-family:Arial,sans-serif;
}

/* canvas */
.gd-canvas {
  padding:20px 0 80px;
  display:flex; flex-direction:column; align-items:center;
  gap:${GAP}px;
}

/* title / subtitle */
.gd-title-area {
  width:100%; border:none; outline:none; resize:none; overflow:hidden;
  font-family:Arial,sans-serif; font-size:26pt; font-weight:400;
  color:#000; line-height:1.15; background:transparent;
  padding:0; margin:0 0 2px; display:block; box-sizing:border-box;
}
.gd-title-area::placeholder { color:#DADCE0; }
.gd-subtitle-area {
  width:100%; border:none; outline:none; background:transparent;
  font-family:Arial,sans-serif; font-size:15pt; color:#5F6368;
  font-style:italic; padding:0; margin:0 0 20px; display:block; box-sizing:border-box;
}
.gd-subtitle-area::placeholder { color:#DADCE0; font-style:italic; }

/* editor */
.gd-editor {
  outline:none; font-family:Arial,sans-serif; font-size:11pt;
  line-height:1.15; color:#000;
  word-wrap:break-word; overflow-wrap:break-word; caret-color:#000;
}
.gd-editor:empty:before {
  content:attr(data-placeholder); color:#BDBDBD; font-style:italic; pointer-events:none;
}
.gd-editor h1 { font-size:20pt; font-weight:400; margin:.67em 0 0; line-height:1.15; }
.gd-editor h2 { font-size:16pt; font-weight:700; margin:.83em 0 0; line-height:1.15; }
.gd-editor h3 { font-size:14pt; font-weight:700; margin:1em 0 0; line-height:1.15; color:#434343; }
.gd-editor p  { margin:0; }
.gd-editor div:not(.gd-checklist-item) { margin:0; }
.gd-editor ul,.gd-editor ol { padding-left:2em; margin:0; }
.gd-editor li { margin:0; }
.gd-editor blockquote {
  border-left:3px solid #DADCE0; padding-left:12px; margin:8px 0;
  color:#5F6368; font-style:italic;
}
.gd-editor a { color:#1155CC; text-decoration:underline; }
.gd-editor img { max-width:100%; height:auto; margin:4px 0; border-radius:2px; }
.gd-editor table { border-collapse:collapse; width:auto; margin:8px 0; }
.gd-editor td,.gd-editor th {
  border:1px solid #BABCBE; padding:5px 8px; min-width:60px;
  vertical-align:top; font-size:inherit; line-height:inherit;
}
.gd-editor th { background:#F1F3F4; font-weight:600; }

.gd-checklist-item { display:flex; align-items:flex-start; gap:8px; padding:1px 0; }
.gd-checklist-item input[type="checkbox"] {
  margin-top:3px; flex-shrink:0; cursor:pointer; width:16px; height:16px; accent-color:#1967D2;
}
.gd-checklist-item span { flex:1; outline:none; }
.gd-checklist-item.checked span { text-decoration:line-through; color:#70757A; }

/* page number */
.gd-page-num {
  position:absolute; bottom:${MARGIN_V / 2 - 6}px; left:0; right:0;
  text-align:center; font-size:10px; color:#ACACAC;
  font-family:Arial,sans-serif; pointer-events:none; user-select:none;
}

@media(max-width:860px){
  .gd-canvas { padding:4px 0 40px; gap:${GAP}px; }
  .gd-toolbar { overflow-x:auto; flex-wrap:nowrap; -webkit-overflow-scrolling:touch; }
}
`
}

// ── SVG icons ─────────────────────────────────────────────────────────────
const sv = (d, w = 15, h = 15, sw = '2') =>
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>

const I = {
  undo:     sv(<><path d="M3 7v6h6"/><path d="M3 13a9 9 0 0 1 15-6.7"/></>),
  redo:     sv(<><path d="M21 7v6h-6"/><path d="M21 13A9 9 0 0 0 6 6.3"/></>),
  bold:     sv(<><path d="M6 4h8a4 4 0 0 1 0 8H6z"/><path d="M6 12h9a4 4 0 0 1 0 8H6z"/></>, 14, 14, '2.5'),
  italic:   sv(<><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></>),
  underline:sv(<><path d="M6 3v7a6 6 0 0 0 12 0V3"/><line x1="4" y1="21" x2="20" y2="21"/></>),
  alignL:   sv(<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></>),
  alignC:   sv(<><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></>),
  alignR:   sv(<><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></>),
  alignJ:   sv(<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>),
  ul:       sv(<><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></>),
  ol:       sv(<><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></>),
  checklist:sv(<><rect x="3" y="3" width="6" height="6" rx="1"/><polyline points="5 5.5 6 7 8 4"/><line x1="12" y1="6" x2="21" y2="6"/><rect x="3" y="15" width="6" height="6" rx="1"/><line x1="12" y1="18" x2="21" y2="18"/></>, 15, 15, '1.5'),
  indentIn: sv(<><polyline points="3 8 7 12 3 16"/><line x1="9" y1="4" x2="21" y2="4"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="20" x2="21" y2="20"/></>),
  indentOut:sv(<><polyline points="7 8 3 12 7 16"/><line x1="9" y1="4" x2="21" y2="4"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="20" x2="21" y2="20"/></>),
  link:     sv(<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>),
  img:      sv(<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>),
  table:    sv(<><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></>, 15, 15, '1.5'),
  spacing:  sv(<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/><polyline points="18 3 18 6"/><polyline points="18 18 18 21"/><path d="M16.5 4.5 18 3l1.5 1.5"/><path d="M16.5 19.5 18 21l1.5-1.5"/></>, 15, 15, '1.5'),
  clear:    sv(<><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/></>),
  quote:    sv(<><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></>),
}

// ── Helpers ───────────────────────────────────────────────────────────────
const PB = '<!--page-break-->'

function parsePages(v) {
  const ps = (v || '').split(PB)
  return ps.length > 0 ? ps : ['']
}

function placeCaretAtEnd(el) {
  el.focus()
  const r = document.createRange(); r.selectNodeContents(el); r.collapse(false)
  const s = window.getSelection(); s.removeAllRanges(); s.addRange(r)
}

/** Ensure all content is in block elements so we can measure per-block */
function wrapBareNodes(el) {
  const groups = []
  let cur = []
  for (const n of Array.from(el.childNodes)) {
    if (n.nodeType === Node.TEXT_NODE || n.nodeName === 'BR') {
      cur.push(n)
    } else {
      if (cur.length) { groups.push([...cur]); cur = [] }
    }
  }
  if (cur.length) groups.push(cur)
  groups.forEach(nodes => {
    const p = document.createElement('p')
    el.insertBefore(p, nodes[0])
    nodes.forEach(n => p.appendChild(n))
  })
}

// ══════════════════════════════════════════════════════════════════════════
export default function PagedEditor({
  value, onChange, placeholder = 'Comece a escrever…',
  title, subtitle, onTitleChange, onSubtitleChange,
  titlePlaceholder = 'Título', subtitlePlaceholder = 'Subtítulo',
}) {
  const pageRefs      = useRef([])
  const savedRange    = useRef(null)
  const activePage    = useRef(0)
  const initDone      = useRef(false)
  const reflowRaf     = useRef(null)
  const pendingMove   = useRef(null) // { fromEl, nodes, nextIdx }

  const [pageCount,   setPageCount]   = useState(2)
  const [displaySize, setDisplaySize] = useState(11)
  const [textColor,   setTextColor]   = useState('#000000')
  const [hlColor,     setHlColor]     = useState('#FFFF00')
  const [showLink,    setShowLink]    = useState(false)
  const [linkUrl,     setLinkUrl]     = useState('')
  const [showTable,   setShowTable]   = useState(false)
  const [tableHover,  setTableHover]  = useState({ r: 0, c: 0 })
  const [showSpacing, setShowSpacing] = useState(false)
  const [fmt, setFmt] = useState({ block:'P', bold:false, italic:false, underline:false, fontFamily:'Arial' })

  // ── CSS ─────────────────────────────────────────────────────────────────
  useEffect(() => { injectCSS() }, [])

  // ── Init content ────────────────────────────────────────────────────────
  useEffect(() => {
    if (initDone.current) return
    initDone.current = true
    const pgs = parsePages(value)
    const count = Math.max(pgs.length, 2)
    setPageCount(count)
    requestAnimationFrame(() => {
      pgs.forEach((html, i) => {
        if (pageRefs.current[i]) pageRefs.current[i].innerHTML = html
      })
      // Initial reflow after content is set
      requestAnimationFrame(() => scheduleReflow(0))
    })
  }, [])

  // ── Execute pending move after React creates new page ───────────────────
  useEffect(() => {
    if (!pendingMove.current) return
    const { fromEl, nodes, nextIdx } = pendingMove.current
    pendingMove.current = null
    requestAnimationFrame(() => {
      const nextEl = pageRefs.current[nextIdx]
      if (!nextEl) return
      const first = nextEl.firstChild
      nodes.forEach(n => {
        try { fromEl.removeChild(n) } catch (_) {}
        first ? nextEl.insertBefore(n, first) : nextEl.appendChild(n)
      })
      fromEl.scrollTop = 0
      syncAndSave()
      scheduleReflow(nextIdx)
    })
  }, [pageCount])

  // ── Cleanup ─────────────────────────────────────────────────────────────
  useEffect(() => () => cancelAnimationFrame(reflowRaf.current), [])

  // ── Save ────────────────────────────────────────────────────────────────
  function syncAndSave() {
    const ps = []
    for (let i = 0; i < pageCount; i++) ps.push(pageRefs.current[i]?.innerHTML || '')
    onChange?.(ps.join(PB))
  }

  // ── Popups ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showLink && !showTable && !showSpacing) return
    const fn = e => { if (!e.target.closest('[data-gd-popup]')) { setShowLink(false); setShowTable(false); setShowSpacing(false) } }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [showLink, showTable, showSpacing])

  // ── Selection tracking ──────────────────────────────────────────────────
  const updateFmt = useCallback(() => {
    setFmt({
      block:     (document.queryCommandValue('formatBlock') || 'p').toUpperCase(),
      bold:       document.queryCommandState('bold'),
      italic:     document.queryCommandState('italic'),
      underline:  document.queryCommandState('underline'),
      fontFamily: document.queryCommandValue('fontName')?.replace(/"/g, '') || 'Arial',
    })
    const sel = window.getSelection()
    if (sel?.anchorNode) {
      const el = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode
      if (el) { const px = parseFloat(window.getComputedStyle(el).fontSize); if (!isNaN(px)) setDisplaySize(Math.round(px * 72 / 96)) }
    }
  }, [])
  useEffect(() => { document.addEventListener('selectionchange', updateFmt); return () => document.removeEventListener('selectionchange', updateFmt) }, [updateFmt])

  // ── Formatting ──────────────────────────────────────────────────────────
  function activeEl() { return pageRefs.current[activePage.current] }
  function exec(cmd, arg) { document.execCommand(cmd, false, arg ?? undefined); activeEl()?.focus(); syncAndSave(); updateFmt() }

  function applySize(pt) {
    const c = Math.min(96, Math.max(6, pt)); setDisplaySize(c)
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.getRangeAt(0).collapsed) return
    document.execCommand('fontSize', false, '7')
    activeEl()?.querySelectorAll('font[size="7"]').forEach(el => { el.removeAttribute('size'); el.style.fontSize = c + 'pt' })
    activeEl()?.focus(); syncAndSave()
  }
  function applyTextColor(hex) { setTextColor(hex); exec('foreColor', hex) }
  function applyHighlight(hex) { setHlColor(hex); exec('hiliteColor', hex) }

  function openLink() {
    const sel = window.getSelection()
    if (sel?.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange()
    setLinkUrl(sel?.anchorNode?.parentElement?.closest('a')?.href || 'https://')
    setShowLink(v => !v); setShowTable(false); setShowSpacing(false)
  }
  function applyLink() {
    if (!linkUrl.trim()) return
    const sel = window.getSelection()
    if (savedRange.current) { sel.removeAllRanges(); sel.addRange(savedRange.current) }
    activeEl()?.focus()
    document.execCommand('createLink', false, linkUrl.trim())
    activeEl()?.querySelectorAll('a').forEach(a => { a.target = '_blank'; a.rel = 'noopener noreferrer' })
    syncAndSave(); setShowLink(false); setLinkUrl('')
  }

  function insertImage() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'
    input.onchange = e => {
      const file = e.target.files[0]; if (!file) return
      if (file.size > 5_000_000) { alert('Imagem muito grande (máx 5 MB).'); return }
      const reader = new FileReader()
      reader.onload = () => { activeEl()?.focus(); exec('insertImage', reader.result) }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  function insertTable(rows, cols) {
    let html = '<table>'
    for (let r = 0; r < rows; r++) { html += '<tr>'; for (let c = 0; c < cols; c++) html += '<td><br></td>'; html += '</tr>' }
    html += '</table><p><br></p>'
    activeEl()?.focus(); document.execCommand('insertHTML', false, html); syncAndSave(); setShowTable(false)
  }

  function setLineSpacing(val) {
    const sel = window.getSelection(); if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0); const el = activeEl()
    const blocks = el?.querySelectorAll('p, h1, h2, h3, div, li, blockquote') || []
    blocks.forEach(b => { if (range.intersectsNode(b)) b.style.lineHeight = val })
    if (blocks.length === 0 && el) el.style.lineHeight = val
    syncAndSave(); setShowSpacing(false)
  }

  function insertChecklist() {
    activeEl()?.focus()
    document.execCommand('insertHTML', false, '<div class="gd-checklist-item" contenteditable="true"><input type="checkbox" contenteditable="false"><span>Item</span></div><p><br></p>')
    syncAndSave()
  }

  function handleEditorClick(e) {
    if (e.target.type === 'checkbox') {
      const item = e.target.closest('.gd-checklist-item')
      if (item) { item.classList.toggle('checked', e.target.checked); syncAndSave() }
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  //  PAGINATION
  // ════════════════════════════════════════════════════════════════════════

  function scheduleReflow(startIdx) {
    cancelAnimationFrame(reflowRaf.current)
    reflowRaf.current = requestAnimationFrame(() => doReflow(startIdx))
  }

  function doReflow(startIdx) {
    let maxIter = 80 // global safety limit against runaway loops

    for (let idx = startIdx; idx < pageCount + 10 && maxIter > 0; idx++) {
      // Re-balance THIS page until it no longer overflows, THEN advance.
      // (A single partial split may not be enough — a block taller than a
      //  full page needs to be sliced repeatedly.)
      let pageGuard = 50
      while (pageGuard-- > 0 && maxIter-- > 0) {
        const el = pageRefs.current[idx]
        if (!el) break

        // Reset any internal scroll so offsetTop measurements are correct
        el.scrollTop = 0
        wrapBareNodes(el)

        const limit = el.clientHeight
        if (limit <= 0) break

        // Page fits → done with this page, move on
        if (el.scrollHeight <= limit + 1) break

        const kids = Array.from(el.children)
        if (kids.length === 0) break

        // First child whose BOTTOM crosses the page limit
        let splitAt = kids.findIndex(k => k.offsetTop + k.offsetHeight > limit)
        if (splitAt === -1) splitAt = kids.length - 1

        const crossing = kids[splitAt]
        let toMove

        if (crossing.offsetTop >= limit - 1) {
          // Whole block sits below the boundary → move it (and the rest) intact
          toMove = kids.slice(splitAt)
        } else {
          // Block straddles the boundary → slice it at the overflowing line.
          // Geometric split (Range rects) works off-screen, unlike the old
          // caretRangeFromPoint approach which silently failed below the fold.
          const overflow = splitBlockAtHeight(crossing, limit - crossing.offsetTop)
          if (overflow) {
            toMove = [overflow, ...kids.slice(splitAt + 1)]
          } else if (splitAt > 0 || kids.length > 1) {
            // Couldn't split → move the whole block down rather than clip it.
            // Worst case leaves blank space; it NEVER cuts text in half.
            toMove = kids.slice(splitAt)
          } else {
            // Single block taller than a full page that refuses to split
            // (e.g. one giant image). Nothing to do without clipping; bail.
            break
          }
        }

        if (toMove.length === 0) break

        const nextIdx = idx + 1
        const nextEl = pageRefs.current[nextIdx]

        if (!nextEl) {
          // Need React to mount a new page; reflow resumes in the effect below
          pendingMove.current = { fromEl: el, nodes: [...toMove], nextIdx }
          setPageCount(c => Math.max(c, nextIdx + 1))
          return
        }

        // Prepend to next page (preserving order)
        const firstChild = nextEl.firstChild
        toMove.forEach(n => {
          try { el.removeChild(n) } catch (_) {}
          firstChild ? nextEl.insertBefore(n, firstChild) : nextEl.appendChild(n)
        })
        el.scrollTop = 0
        // loop again — this page may STILL overflow after a partial split
      }
    }

    // ── After all overflow resolved: try pulling content UP ───────────
    for (let idx = 0; idx < pageCount - 1; idx++) {
      pullUpContent(idx)
    }

    syncAndSave()
  }

  /**
   * Split a block at a given available height and return the overflowing tail
   * as a new block (or null if it can't/shouldn't be split).
   *
   * Uses Range.getBoundingClientRect for measurement — this reports correct
   * geometry even when the block is scrolled off-screen, unlike
   * caretRangeFromPoint, which returns null outside the viewport and was the
   * root cause of text being clipped on pages below the fold.
   */
  function splitBlockAtHeight(block, avail) {
    const top = block.getBoundingClientRect().top
    const bottomThrough = node => {
      const r = document.createRange()
      r.setStart(block, 0); r.setEndAfter(node)
      return r.getBoundingClientRect().bottom - top
    }
    const startsBelow = node => {
      const r = document.createRange()
      r.setStart(block, 0); r.setEndBefore(node)
      return r.getBoundingClientRect().bottom - top
    }

    const kids = Array.from(block.childNodes)
    // First child whose bottom crosses the available height
    let cut = -1
    for (let i = 0; i < kids.length; i++) {
      if (bottomThrough(kids[i]) > avail) { cut = i; break }
    }
    if (cut <= 0) return null // first line already doesn't fit, or nothing overflows

    const node = kids[cut]
    let startNode = node, startOffset = 0, splitInside = false

    // A text node may straddle the boundary across several wrapped lines —
    // binary-search the character offset that still fits, then back up to a
    // word boundary so we never cut a word in half.
    if (node.nodeType === Node.TEXT_NODE && startsBelow(node) <= avail) {
      const text = node.textContent
      let lo = 0, hi = text.length, best = 0
      while (lo <= hi) {
        const mid = (lo + hi) >> 1
        const r = document.createRange()
        r.setStart(block, 0); r.setEnd(node, mid)
        if (r.getBoundingClientRect().bottom - top <= avail) { best = mid; lo = mid + 1 }
        else hi = mid - 1
      }
      let ws = best
      while (ws > 0 && !/\s/.test(text[ws - 1])) ws-- // rewind to word start
      if (ws > 0) { startOffset = ws; splitInside = true }
    }

    const ext = document.createRange()
    splitInside ? ext.setStart(startNode, startOffset) : ext.setStartBefore(node)
    ext.setEndAfter(block.lastChild)
    const frag = ext.extractContents()

    // Don't let the next page open with a dangling blank line
    while (frag.firstChild && frag.firstChild.nodeName === 'BR') frag.removeChild(frag.firstChild)
    if (!frag.textContent.trim() && !frag.querySelector?.('img,table')) return null

    const newBlock = document.createElement(block.nodeName || 'P')
    if (block.className) newBlock.className = block.className
    if (block.style?.cssText) newBlock.style.cssText = block.style.cssText
    newBlock.appendChild(frag)
    return newBlock
  }

  /** Pull the first block of next page into current page if it fits */
  function pullUpContent(idx) {
    const el = pageRefs.current[idx]
    const nextEl = pageRefs.current[idx + 1]
    if (!el || !nextEl || !nextEl.firstChild) return

    el.scrollTop = 0
    const limit = el.clientHeight
    if (limit <= 0) return

    const kids = Array.from(el.children)
    const bottom = kids.length > 0 ? kids[kids.length - 1].offsetTop + kids[kids.length - 1].offsetHeight : 0
    if (limit - bottom < 20) return

    const candidate = nextEl.firstChild
    el.appendChild(candidate)

    const newKids = Array.from(el.children)
    const newLast = newKids[newKids.length - 1]
    if (newLast.offsetTop + newLast.offsetHeight > limit) {
      nextEl.insertBefore(candidate, nextEl.firstChild) // doesn't fit
    } else {
      pullUpContent(idx) // try more
    }
  }

  function handleInput(idx) { scheduleReflow(idx) }

  function handleKeyDown(idx, e) {
    if (e.key === 'Backspace') {
      const sel = window.getSelection(); if (!sel || sel.rangeCount === 0) return
      const range = sel.getRangeAt(0); if (!range.collapsed) return
      const el = pageRefs.current[idx]
      const atStart = range.startOffset === 0 && (
        range.startContainer === el || range.startContainer === el.firstChild ||
        (el.firstChild && range.startContainer === el.firstChild.firstChild)
      )
      if (atStart && idx > 0) {
        e.preventDefault()
        const prevEl = pageRefs.current[idx - 1]
        if (prevEl) {
          while (el.firstChild) prevEl.appendChild(el.firstChild)
          placeCaretAtEnd(prevEl); activePage.current = idx - 1
          syncAndSave(); scheduleReflow(idx - 1)
        }
      }
    }
  }

  // ── Toolbar ─────────────────────────────────────────────────────────────
  const Btn = ({ cmd, arg, icon, tip, active, onClick }) => (
    <button className={`gd-tb-btn${active ? ' on' : ''}`}
      onMouseDown={e => { e.preventDefault(); onClick ? onClick() : exec(cmd, arg) }}
      title={tip}>{icon}</button>
  )
  const Sep = () => <div className="gd-tb-sep" />

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="gd-shell">
      <div className="gd-toolbar">
        <Btn icon={I.undo} cmd="undo" tip="Desfazer (Ctrl+Z)" />
        <Btn icon={I.redo} cmd="redo" tip="Refazer (Ctrl+Y)" />
        <Sep />
        <select className="gd-tb-select" value={fmt.block} onChange={e => exec('formatBlock', e.target.value)} title="Estilo do parágrafo" style={{ minWidth: 110 }}>
          <option value="P">Texto normal</option>
          <option value="H1">Título 1</option>
          <option value="H2">Título 2</option>
          <option value="H3">Título 3</option>
          <option value="BLOCKQUOTE">Citação</option>
        </select>
        <select className="gd-tb-select" value={fmt.fontFamily} onChange={e => exec('fontName', e.target.value)} title="Fonte" style={{ maxWidth: 130 }}>
          {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
        </select>
        <Sep />
        <div className="gd-tb-size">
          <button className="gd-tb-btn" onMouseDown={e => { e.preventDefault(); applySize(displaySize - 1) }} title="Diminuir fonte">
            <svg width="10" height="10" viewBox="0 0 10 2"><line x1="0" y1="1" x2="10" y2="1" stroke="currentColor" strokeWidth="1.5"/></svg>
          </button>
          <input type="number" value={displaySize} min={6} max={96}
            onChange={e => setDisplaySize(Number(e.target.value))}
            onBlur={e => applySize(Number(e.target.value))}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applySize(Number(e.target.value)) }}} />
          <button className="gd-tb-btn" onMouseDown={e => { e.preventDefault(); applySize(displaySize + 1) }} title="Aumentar fonte">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <line x1="5" y1="0" x2="5" y2="10" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="0" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
        </div>
        <Sep />
        <Btn cmd="bold" icon={I.bold} tip="Negrito (Ctrl+B)" active={fmt.bold} />
        <Btn cmd="italic" icon={I.italic} tip="Itálico (Ctrl+I)" active={fmt.italic} />
        <Btn cmd="underline" icon={I.underline} tip="Sublinhado (Ctrl+U)" active={fmt.underline} />
        <button className="gd-tb-btn gd-color-wrap" title="Cor do texto">
          <span style={{ fontWeight:700, fontSize:14, lineHeight:1, display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>
            A<span style={{ width:14, height:3, borderRadius:1, background:textColor, marginTop:-1 }} />
          </span>
          <input type="color" value={textColor} onChange={e => applyTextColor(e.target.value)} />
        </button>
        <button className="gd-tb-btn gd-color-wrap" title="Cor de destaque">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            <line x1="2" y1="22" x2="22" y2="22" stroke={hlColor} strokeWidth="3"/>
          </svg>
          <input type="color" value={hlColor} onChange={e => applyHighlight(e.target.value)} />
        </button>
        <Sep />
        <div className="gd-dd-wrap" data-gd-popup>
          <Btn icon={I.link} tip="Inserir link (Ctrl+K)" onClick={openLink} />
          {showLink && (
            <div className="gd-link-pop" data-gd-popup>
              <input autoFocus type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter') applyLink(); if (e.key==='Escape') setShowLink(false) }} placeholder="https://" />
              <button onClick={applyLink} style={{ background:'#1967D2', color:'#fff' }}>Aplicar</button>
              <button onClick={() => setShowLink(false)} style={{ background:'#F1F3F4', color:'#444' }}>✕</button>
            </div>
          )}
        </div>
        <Btn icon={I.img} tip="Inserir imagem" onClick={insertImage} />
        <div className="gd-dd-wrap" data-gd-popup>
          <Btn icon={I.table} tip="Inserir tabela" onClick={() => { setShowTable(v => !v); setShowLink(false); setShowSpacing(false) }} />
          {showTable && (
            <div className="gd-table-picker" data-gd-popup>
              <div className="gd-table-grid">
                {Array.from({ length: 6 }, (_, r) =>
                  Array.from({ length: 6 }, (_, c) => (
                    <div key={`${r}-${c}`}
                      className={`gd-table-cell${r+1<=tableHover.r && c+1<=tableHover.c?' on':''}`}
                      onMouseEnter={() => setTableHover({ r:r+1, c:c+1 })}
                      onClick={() => insertTable(tableHover.r, tableHover.c)} />
                  ))
                )}
              </div>
              <div className="gd-table-label">{tableHover.r} × {tableHover.c}</div>
            </div>
          )}
        </div>
        <Sep />
        <Btn cmd="justifyLeft" icon={I.alignL} tip="Alinhar à esquerda" />
        <Btn cmd="justifyCenter" icon={I.alignC} tip="Centralizar" />
        <Btn cmd="justifyRight" icon={I.alignR} tip="Alinhar à direita" />
        <Btn cmd="justifyFull" icon={I.alignJ} tip="Justificar" />
        <div className="gd-dd-wrap" data-gd-popup>
          <Btn icon={I.spacing} tip="Espaçamento de linha" onClick={() => { setShowSpacing(v => !v); setShowLink(false); setShowTable(false) }} />
          {showSpacing && (
            <div className="gd-dropdown" data-gd-popup>
              {[['1','Simples'],['1.15','1,15'],['1.5','1,5'],['2','Duplo']].map(([v,l]) => (
                <button key={v} onClick={() => setLineSpacing(v)}>{l}</button>
              ))}
            </div>
          )}
        </div>
        <Sep />
        <Btn cmd="insertUnorderedList" icon={I.ul} tip="Lista com marcadores" />
        <Btn cmd="insertOrderedList" icon={I.ol} tip="Lista numerada" />
        <Btn icon={I.checklist} tip="Lista de verificação" onClick={insertChecklist} />
        <Sep />
        <Btn cmd="outdent" icon={I.indentOut} tip="Diminuir recuo" />
        <Btn cmd="indent" icon={I.indentIn} tip="Aumentar recuo" />
        <Sep />
        <Btn cmd="formatBlock" arg="BLOCKQUOTE" icon={I.quote} tip="Citação" />
        <button className="gd-tb-btn" onMouseDown={e => { e.preventDefault(); exec('removeFormat') }} title="Limpar formatação">{I.clear}</button>
      </div>

      {/* ═══════════ PAGES ═══════════ */}
      <div className="gd-canvas">
        {Array.from({ length: pageCount }, (_, idx) => (
          /* ── PAGE SHEET ── */
          <div key={idx} style={{
            width: PAGE_W,
            height: PAGE_H,
            background: '#fff',
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
            boxShadow: '0 0 0 .5px rgba(0,0,0,.08), 0 1px 6px rgba(0,0,0,.12)',
          }}>
            {/* ── CONTENT AREA — inside the 1-inch margins ── */}
            <div style={{
              position: 'absolute',
              top: MARGIN_V,
              left: MARGIN_H,
              right: MARGIN_H,
              bottom: MARGIN_V,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Title/subtitle on page 0 */}
              {idx === 0 && onTitleChange && (
                <div style={{ flexShrink: 0 }}>
                  <textarea value={title || ''} onChange={e => { onTitleChange(e.target.value); scheduleReflow(0) }}
                    placeholder={titlePlaceholder} className="gd-title-area" rows={1}
                    onInput={e => { e.target.style.height = '1px'; e.target.style.height = e.target.scrollHeight + 'px' }} />
                  {onSubtitleChange && (
                    <input value={subtitle || ''} onChange={e => onSubtitleChange(e.target.value)}
                      placeholder={subtitlePlaceholder} className="gd-subtitle-area" />
                  )}
                </div>
              )}

              {/* EDITOR — fills remaining space, overflow hidden clips at margin */}
              <div
                ref={el => { pageRefs.current[idx] = el }}
                className="gd-editor"
                contentEditable suppressContentEditableWarning
                data-placeholder={idx === 0 ? placeholder : ''}
                onFocus={() => { activePage.current = idx }}
                onInput={() => handleInput(idx)}
                onKeyDown={e => handleKeyDown(idx, e)}
                onKeyUp={updateFmt} onMouseUp={updateFmt}
                onClick={handleEditorClick} spellCheck
                style={{
                  flex: 1,
                  minHeight: 0,   /* allow flex to shrink below content */
                  overflow: 'hidden',
                  position: 'relative',
                }}
              />
            </div>

            {/* Page number — centered in bottom margin */}
            <div className="gd-page-num">{idx + 1}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
