/**
 * MarkdownContent — renders markdown text using react-markdown with GFM support.
 * Custom component overrides use themed styles via useTheme().
 * Used by MessageBubble and StreamingBlockRenderer for text blocks.
 */

import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTheme } from '@/lib/theming'
import { CodeBlock } from './CodeBlock'

export interface MarkdownContentProps {
  content: string
  className?: string
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const t = useTheme()

  const components: Components = {
    code({ className: codeClassName, children, ...rest }) {
      // Detect fenced code blocks: react-markdown sets className="language-xxx"
      const match = /language-(\w+)/.exec(codeClassName || '')
      const codeString = String(children).replace(/\n$/, '')

      if (match) {
        return <CodeBlock code={codeString} language={match[1]} />
      }

      // Inline code
      return (
        <code
          className={`${t.elevated} rounded px-1 py-0.5 text-sm font-mono`}
          {...rest}
        >
          {children}
        </code>
      )
    },

    pre({ children }) {
      // The pre wrapper for fenced code blocks — just pass through
      // because CodeBlock handles its own wrapper
      return <>{children}</>
    },

    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-primary hover:underline"
        >
          {children}
        </a>
      )
    },

    p({ children }) {
      return <p className="mb-2 last:mb-0">{children}</p>
    },

    ul({ children }) {
      return <ul className="ml-4 mb-2 last:mb-0 list-disc">{children}</ul>
    },

    ol({ children }) {
      return <ol className="ml-4 mb-2 last:mb-0 list-decimal">{children}</ol>
    },

    li({ children }) {
      return <li className="mb-0.5">{children}</li>
    },

    strong({ children }) {
      return <strong className="font-semibold">{children}</strong>
    },

    em({ children }) {
      return <em className="italic">{children}</em>
    },

    blockquote({ children }) {
      return (
        <blockquote className={`border-l-2 border-border-default pl-3 ${t.textSecondary} mb-2 last:mb-0`}>
          {children}
        </blockquote>
      )
    },

    hr() {
      return <hr className="border-border-default my-3" />
    },

    h1({ children }) {
      return <h1 className={`text-lg font-bold mb-2 ${t.textPrimary}`}>{children}</h1>
    },

    h2({ children }) {
      return <h2 className={`text-base font-bold mb-2 ${t.textPrimary}`}>{children}</h2>
    },

    h3({ children }) {
      return <h3 className={`text-sm font-bold mb-1 ${t.textPrimary}`}>{children}</h3>
    },

    table({ children }) {
      return (
        <div className="overflow-x-auto mb-2 last:mb-0">
          <table className={`text-sm ${t.border} border-collapse w-full`}>
            {children}
          </table>
        </div>
      )
    },

    th({ children }) {
      return (
        <th className={`${t.elevated} border border-border-default px-2 py-1 text-left font-semibold`}>
          {children}
        </th>
      )
    },

    td({ children }) {
      return (
        <td className="border border-border-default px-2 py-1">
          {children}
        </td>
      )
    },
  }

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
