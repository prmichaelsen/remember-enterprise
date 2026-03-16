import type { MessageContent } from '@/types/conversations'

/**
 * Extract plain text from MessageContent.
 * If content is a string, returns it directly.
 * If content is ContentBlock[], joins all text blocks.
 */
export function getTextContent(content: MessageContent): string {
  if (typeof content === 'string') return content
  return content.filter((b) => b.type === 'text').map((b) => b.text).join('')
}
