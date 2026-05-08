import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

function AnswerTextarea({ value, onSave, placeholder }) {
  const [local, setLocal] = useState(value)
  const timerRef = useRef(null)
  const isFocused = useRef(false)

  useEffect(() => {
    if (!isFocused.current) setLocal(value)
  }, [value])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  function handleChange(e) {
    const v = e.target.value
    setLocal(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onSave(v), 800)
  }

  return (
    <textarea
      value={local}
      onChange={handleChange}
      onFocus={() => { isFocused.current = true }}
      onBlur={() => {
        isFocused.current = false
        clearTimeout(timerRef.current)
        onSave(local)
      }}
      placeholder={placeholder}
      rows={4}
      className="w-full bg-transparent text-[13px] text-[#1A3A1F] placeholder-[#C4A882] leading-relaxed focus:outline-none resize-none"
    />
  )
}

export default function QuestionsList({ questions, onUpdateAnswer, onDelete }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div
          key={q.id}
          className="group relative bg-[#FAF7F2] border border-[#E8E0D0] rounded-xl px-4 py-3"
        >
          <button
            onClick={() => onDelete(q.id)}
            aria-label={t('projects.deleteQuestion')}
            className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#C4A882] hover:text-[#A83228] p-0.5"
          >
            <X size={13} />
          </button>

          <p className="text-[11px] font-semibold text-[#C4A882] uppercase tracking-wide mb-1.5 pr-5">
            {i + 1}. {q.text || t('projects.question')}
          </p>

          <AnswerTextarea
            value={q.answer || ''}
            onSave={v => onUpdateAnswer(q.id, v)}
            placeholder={t('projects.answerPlaceholder')}
          />
        </div>
      ))}
    </div>
  )
}
