import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder: string
}

export default function TagInput({ label, values, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState('')

  const addTags = (rawValue: string) => {
    const newValues = rawValue
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
    if (newValues.length === 0) return

    const existing = new Set(values.map((value) => value.toLocaleLowerCase()))
    const uniqueValues = newValues.filter((value) => {
      const key = value.toLocaleLowerCase()
      if (existing.has(key)) return false
      existing.add(key)
      return true
    })
    if (uniqueValues.length > 0) onChange([...values, ...uniqueValues])
    setInput('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTags(input)
    } else if (event.key === 'Backspace' && !input && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20">
        {values.map((value, index) => (
          <span
            key={`${value.toLocaleLowerCase()}-${index}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            {value}
            <button
              type="button"
              aria-label={`Remove ${value}`}
              onClick={() => onChange(values.filter((_, valueIndex) => valueIndex !== index))}
              className="rounded-full text-slate-500 transition hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
            >
              <X size={13} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(event) => {
            if (event.target.value.includes(',')) addTags(event.target.value)
            else setInput(event.target.value)
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (input.trim()) addTags(input)
          }}
          className="min-w-[10rem] flex-1 border-0 bg-transparent px-0 py-1 text-sm text-slate-800 outline-none focus:ring-0"
          placeholder={values.length ? 'Add another…' : placeholder}
        />
      </div>
    </div>
  )
}
