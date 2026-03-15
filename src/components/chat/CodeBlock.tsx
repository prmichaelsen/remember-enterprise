/**
 * CodeBlock — renders a fenced code block with language label and copy button.
 * Uses themed styles via useTheme(). No syntax highlighting for MVP.
 */

import { useState, useCallback } from 'react'
import { useTheme } from '@/lib/theming'
import { Copy, Check } from 'lucide-react'

export interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const t = useTheme()
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  return (
    <div className={`${t.elevated} ${t.border} rounded-lg overflow-hidden my-2`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border-default">
        <span className={`text-xs ${t.textMuted}`}>
          {language || 'text'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={`p-1 rounded ${t.buttonGhost} transition-colors`}
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Code area */}
      <pre className="overflow-x-auto p-4 m-0">
        <code className={`text-sm font-mono ${t.textPrimary}`}>
          {code}
        </code>
      </pre>
    </div>
  )
}
