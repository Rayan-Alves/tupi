import { useRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const CSS = `
.re-wrap { font-family: 'Georgia', 'Times New Roman', serif; }
.re-toolbar {
  position: sticky; top: 0; z-index: 5;
  display: flex; flex-wrap: wrap; gap: 4px;
  background: rgba(255,255,255,0.95); backdrop-filter: blur(8px);
  border-bottom: 1px solid #e4e4e7;
  padding: 8px 12px;
}
.re-btn {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; border-radius: 6px;
  cursor: pointer; color: #52525b; font-size: 13px; transition: all .15s;
  font-family: inherit;
}
.re-btn:hover { background: #f4f4f5; color: #1a1a1a; }
.re-btn.active { background: #e4e4e7; color: #1a1a1a; }
.re-sep { width: 1px; background: #e4e4e7; margin: 4px 6px; }
.re-select {
  height: 30px; border: none; background: transparent; cursor: pointer;
  font-size: 12px; color: #52525b; padding: 0 6px; border-radius: 6px;
  font-family: inherit; outline: none;
}
.re-select:hover { background: #f4f4f5; }
.re-content {
  min-height: 50vh; padding: 2.5rem 3rem; outline: none;
  font-size: 17px; line-height: 1.7; color: #1a1a1a;
  font-family: 'Georgia', 'Times New Roman', serif;
}
.re-content:empty:before {
  content: attr(data-placeholder); color: #d4d4d8; pointer-events: none;
  font-style: italic;
}
.re-content h1 { font-size: 28px; font-weight: 700; margin: 0.8em 0 0.4em; line-height: 1.3; }
.re-content h2 { font-size: 22px; font-weight: 700; margin: 0.7em 0 0.3em; line-height: 1.3; }
.re-content h3 { font-size: 18px; font-weight: 600; margin: 0.6em 0 0.3em; line-height: 1.3; }
.re-content p { margin: 0.4em 0; }
.re-content ul, .re-content ol { padding-left: 1.5em; margin: 0.5em 0; }
.re-content li { margin: 0.2em 0; }
.re-content blockquote {
  border-left: 3px solid #c4a882; padding-left: 1em; margin: 0.6em 0;
  color: #52525b; font-style: italic;
}
.re-content img { max-width: 100%; height: auto; margin: 0.5em 0; border-radius: 8px; }
.re-content a { color: #3b6dc4; text-decoration: underline; }
@media (max-width: 640px) {
  .re-content { padding: 1.5rem 1.25rem; font-size: 16px; }
}
`

function injectStyles() {
  const id = 're-styles'
  if (!document.getElementById(id)) {
    const el = document.createElement('style')
    el.id = id; el.textContent = CSS
    document.head.appendChild(el)
  }
}

export default function RichEditor({ value, onChange, placeholder }) {
  const { t } = useTranslation()
  const ref = useRef(null)
  const initRef = useRef(false)
  const lastSaved = useRef(value || '')
  const [block, setBlock] = useState('P')

  useEffect(() => { injectStyles() }, [])

  useEffect(() => {
    if (!ref.current) return
    if (!initRef.current) {
      ref.current.innerHTML = value || ''
      initRef.current = true
      lastSaved.current = value || ''
    } else if ((value || '') !== lastSaved.current) {
      // External value change — sync only if differs from saved
      ref.current.innerHTML = value || ''
      lastSaved.current = value || ''
    }
  }, [value])

  function exec(cmd, arg) {
    document.execCommand(cmd, false, arg)
    ref.current?.focus()
    save()
  }

  function save() {
    const html = ref.current?.innerHTML || ''
    if (html !== lastSaved.current) {
      lastSaved.current = html
      onChange?.(html)
    }
  }

  function changeBlock(e) {
    const v = e.target.value
    setBlock(v)
    exec('formatBlock', v)
  }

  function insertImage() {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = e => {
      const file = e.target.files[0]
      if (!file) return
      if (file.size > 2_000_000) {
        alert('Imagem grande demais (máx 2MB).')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        ref.current?.focus()
        document.execCommand('insertImage', false, reader.result)
        save()
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  return (
    <div className="re-wrap">
      <div className="re-toolbar">
        <select className="re-select" value={block} onChange={changeBlock}>
          <option value="P">Texto</option>
          <option value="H1">Título</option>
          <option value="H2">Subtítulo</option>
          <option value="H3">Seção</option>
        </select>
        <div className="re-sep" />
        <button className="re-btn" onClick={() => exec('bold')} title="Negrito"><b>B</b></button>
        <button className="re-btn" onClick={() => exec('italic')} title={t('editor.italic')}><i>I</i></button>
        <button className="re-btn" onClick={() => exec('underline')} title="Sublinhado"><u>U</u></button>
        <div className="re-sep" />
        <button className="re-btn" onClick={() => exec('justifyLeft')} title="Alinhar à esquerda">⇤</button>
        <button className="re-btn" onClick={() => exec('justifyCenter')} title="Centralizar">≡</button>
        <button className="re-btn" onClick={() => exec('justifyRight')} title="Alinhar à direita">⇥</button>
        <div className="re-sep" />
        <button className="re-btn" onClick={() => exec('insertUnorderedList')} title="Lista">•</button>
        <button className="re-btn" onClick={() => exec('insertOrderedList')} title="Lista numerada">1.</button>
        <button className="re-btn" onClick={() => exec('formatBlock', 'BLOCKQUOTE')} title={t('editor.quote')}>"</button>
        <div className="re-sep" />
        <button className="re-btn" onClick={insertImage} title="Imagem">🖼</button>
        <button className="re-btn" onClick={() => exec('removeFormat')} title="Limpar formatação">⌫</button>
      </div>
      <div
        ref={ref}
        className="re-content"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={save}
        onBlur={save}
        spellCheck={true}
      />
    </div>
  )
}
