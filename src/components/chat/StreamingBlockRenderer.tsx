/**
 * StreamingBlockRenderer — maps an ordered list of StreamingBlock items
 * into inline React elements: plain text spans and ToolCallBadge pills.
 * Shows a blinking cursor at the end while streaming is active.
 */

import type { StreamingBlock } from '@/types/streaming'
import { ToolCallBadge } from './ToolCallBadge'

export interface StreamingBlockRendererProps {
  blocks: StreamingBlock[]
  isStreaming?: boolean
}

export function StreamingBlockRenderer({
  blocks,
  isStreaming = false,
}: StreamingBlockRendererProps) {
  return (
    <span className="inline">
      {blocks.map((block, i) => {
        if (block.type === 'text') {
          return (
            <span key={`text-${i}`} className="whitespace-pre-wrap">
              {block.text}
            </span>
          )
        }

        if (block.type === 'tool_use') {
          return (
            <ToolCallBadge
              key={block.id ?? `tool-${i}`}
              name={block.name}
              status={block.status}
              id={block.id}
            />
          )
        }

        return null
      })}

      {isStreaming && (
        <span
          aria-label="Streaming"
          className="inline-block w-2 h-4 bg-brand-primary animate-pulse rounded-sm align-text-bottom ml-0.5"
        />
      )}
    </span>
  )
}
