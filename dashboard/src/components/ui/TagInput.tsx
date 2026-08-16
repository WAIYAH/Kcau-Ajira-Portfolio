import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import Input from './Input'
import { cn } from '@/lib/cn'

export interface TagInputProps {
  id?: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
}

export default function TagInput({ id, values, onChange, placeholder, className }: TagInputProps) {
  const [input, setInput] = useState('')

  function add() {
    const value = input.trim()
    if (!value) return
    if (!values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      onChange([...values, value])
    }
    setInput('')
  }

  function remove(value: string) {
    onChange(values.filter((v) => v !== value))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && !input && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  return (
    <div className={className}>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pl-2.5 pr-1.5 text-xs font-medium text-primary"
            >
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                className="rounded-full p-0.5 hover:bg-primary/20"
                aria-label={`Remove ${v}`}
              >
                <X size={12} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        id={id}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={add}
        placeholder={placeholder}
        className={cn(values.length > 0 && 'mt-3')}
      />
    </div>
  )
}
