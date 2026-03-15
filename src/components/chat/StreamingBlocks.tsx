/**
 * StreamingBlocks — renders interleaved text and tool-use blocks
 * during agent response generation. Displayed below the last message
 * in MessageList while the agent is streaming.
 */

import { useTheme } from '@/lib/theming'
import type { StreamingBlock, ToolUseBlock } from '@/types/streaming'
import { Loader2, CheckCircle2, AlertCircle, Wrench } from 'lucide-react'

interface StreamingBlocksProps {
  blocks: StreamingBlock[]
}

export function StreamingBlocks({ blocks }: StreamingBlocksProps) {
  const t = useTheme()

  if (blocks.length === 0) return null

  return (
    <div className="flex gap-3 py-1.5 flex-row">
      {/* Agent avatar placeholder */}
      <div className="shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${t.elevated}`}
        >
          <span className={`text-xs font-medium ${t.textSecondary}`}>A</span>
        </div>
      </div>

      {/* Streaming content */}
      <div className="max-w-[70%] items-start">
        <p className={`text-xs font-medium mb-0.5 ${t.textSecondary}`}>
          Agent
          <span className={`ml-1.5 ${t.badgeInfo} px-1.5 py-0.5 rounded text-[10px]`}>
            Streaming
          </span>
        </p>

        <div className={`px-3 py-2 rounded-lg ${t.messageAgent}`}>
          {blocks.map((block, index) => {
            if (block.type === 'text') {
              return (
                <div
                  key={`text-${index}`}
                  className={`text-sm whitespace-pre-wrap break-words ${t.textPrimary}`}
                >
                  {block.text}
                  {/* Blinking cursor on the last text block */}
                  {index === blocks.length - 1 && (
                    <span className="inline-block w-0.5 h-4 ml-0.5 animate-pulse align-text-bottom" style={{ background: 'currentColor' }} />
                  )}
                </div>
              )
            }

            if (block.type === 'tool_use') {
              return (
                <ToolUseBlockDisplay key={block.id} block={block} />
              )
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}

function ToolUseBlockDisplay({ block }: { block: ToolUseBlock }) {
  const t = useTheme()

  const statusIcon =
    block.status === 'running' ? (
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
    ) : block.status === 'complete' ? (
      <CheckCircle2 className="w-3.5 h-3.5" />
    ) : (
      <AlertCircle className="w-3.5 h-3.5" />
    )

  const statusBadge =
    block.status === 'running'
      ? t.badgeWarning
      : block.status === 'complete'
        ? t.badgeSuccess
        : 'bg-red-500/15 text-red-500'

  return (
    <div className={`my-1.5 px-2.5 py-1.5 rounded-md ${t.elevated} flex items-center gap-2`}>
      <Wrench className={`w-3.5 h-3.5 shrink-0 ${t.textMuted}`} />
      <span className={`text-xs font-medium ${t.textPrimary} flex-1 min-w-0 truncate`}>
        {block.name}
      </span>
      <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${statusBadge}`}>
        {statusIcon}
        {block.status === 'running' ? 'Running' : block.status === 'complete' ? 'Done' : 'Error'}
      </span>
      {block.result && block.status !== 'running' && (
        <span className={`text-[10px] ${t.textMuted} truncate max-w-[120px]`}>
          {block.result}
        </span>
      )}
    </div>
  )
}
