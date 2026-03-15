/**
 * Streaming block types for interleaved text and tool-use rendering
 * during agent response generation.
 *
 * Pattern ported from agentbase.me: the agent stream produces a sequence
 * of blocks — text chunks are appended to the current TextBlock, and
 * tool_call events insert ToolUseBlock entries between text runs.
 */

export interface TextBlock {
  type: 'text'
  text: string
}

export type ToolUseStatus = 'running' | 'complete' | 'error'

export interface ToolUseBlock {
  type: 'tool_use'
  id: string
  name: string
  status: ToolUseStatus
  /** Optional result summary shown after completion */
  result?: string
}

export type StreamingBlock = TextBlock | ToolUseBlock

/**
 * Helper to create a fresh text block.
 */
export function createTextBlock(text = ''): TextBlock {
  return { type: 'text', text }
}

/**
 * Helper to create a tool-use block in running state.
 */
export function createToolUseBlock(id: string, name: string): ToolUseBlock {
  return { type: 'tool_use', id, name, status: 'running' }
}

/**
 * Append a text chunk to a list of streaming blocks.
 * If the last block is a TextBlock, the chunk is concatenated.
 * Otherwise, a new TextBlock is pushed.
 */
export function appendTextChunk(
  blocks: StreamingBlock[],
  chunk: string,
): StreamingBlock[] {
  const next = [...blocks]
  const last = next[next.length - 1]

  if (last && last.type === 'text') {
    // Replace last entry with updated text (immutable)
    next[next.length - 1] = { ...last, text: last.text + chunk }
  } else {
    next.push(createTextBlock(chunk))
  }

  return next
}

/**
 * Insert a new tool-use block and return updated array.
 * Starts a fresh text block after if subsequent text arrives.
 */
export function insertToolUseBlock(
  blocks: StreamingBlock[],
  id: string,
  name: string,
): StreamingBlock[] {
  return [...blocks, createToolUseBlock(id, name)]
}

/**
 * Mark a tool-use block as complete (or error) by id.
 */
export function completeToolUseBlock(
  blocks: StreamingBlock[],
  id: string,
  status: 'complete' | 'error' = 'complete',
  result?: string,
): StreamingBlock[] {
  return blocks.map((block) => {
    if (block.type === 'tool_use' && block.id === id) {
      return { ...block, status, result }
    }
    return block
  })
}

/**
 * Assemble all text blocks into a single content string (for final message).
 */
export function assembleContent(blocks: StreamingBlock[]): string {
  return blocks
    .filter((b): b is TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
}
