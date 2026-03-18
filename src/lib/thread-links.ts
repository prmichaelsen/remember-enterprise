/**
 * Thread deep link utilities
 */

export function getThreadLink(
  conversationId: string,
  parentMessageId: string,
  replyId?: string
): string {
  const base = `/chat/${conversationId}`
  const hash = replyId
    ? `#thread-${parentMessageId}/reply-${replyId}`
    : `#thread-${parentMessageId}`
  return `${base}${hash}`
}

export function parseThreadHash(hash: string): { parentId: string; replyId?: string } | null {
  if (!hash) return null

  const threadMatch = hash.match(/#thread-([^/]+)(?:\/reply-([^/]+))?/)
  if (!threadMatch) return null

  const [, parentId, replyId] = threadMatch
  return { parentId, replyId }
}
