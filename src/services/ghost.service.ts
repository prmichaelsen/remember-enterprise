/**
 * Ghost Service — AI persona conversation management.
 * Wraps GhostConfigService from remember-core for persona resolution,
 * trust-tier memory access, and conversation lifecycle.
 */

export interface GhostPersona {
  id: string
  name: string
  description: string
  avatarUrl: string | null
  /** Trust tier determines what memories the ghost can access */
  trustTier: 'public' | 'friends' | 'inner-circle' | 'private'
  /** System prompt injector content for this ghost */
  systemPromptFragment: string
  createdAt: string
}

export interface GhostConversation {
  id: string
  ghostId: string
  ghostName: string
  userId: string
  messages: GhostMessage[]
  createdAt: string
  updatedAt: string
}

export interface GhostMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface GhostStreamCallbacks {
  onChunk: (chunk: string) => void
  onComplete: (fullContent: string) => void
  onError: (error: string) => void
}

/**
 * GhostService — list ghosts, manage conversations, stream responses.
 *
 * Ghost conversations use the ChatEngine with a ghost persona prompt injector.
 * Trust-tier determines which memories are injected into context.
 */
export const GhostService = {
  /**
   * List available ghost personas for the current user.
   */
  async listGhosts(): Promise<GhostPersona[]> {
    const res = await fetch('/api/ghosts')
    if (!res.ok) {
      throw new Error(`Failed to list ghosts (${res.status})`)
    }
    const data = (await res.json()) as any
    return data.ghosts ?? []
  },

  /**
   * Get or create a conversation with a specific ghost.
   * If a conversation already exists, returns the existing one with message history.
   */
  async getOrCreateConversation(ghostId: string): Promise<GhostConversation> {
    const res = await fetch(`/api/ghosts/${ghostId}/conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) {
      throw new Error(`Failed to get ghost conversation (${res.status})`)
    }
    return res.json()
  },

  /**
   * Send a message in a ghost conversation.
   * Response streams back via WebSocket (agent_response_chunk events).
   * Returns the final assistant message.
   */
  async sendMessage(
    conversationId: string,
    content: string,
  ): Promise<GhostMessage> {
    const res = await fetch(`/api/ghosts/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as any
      throw new Error(body.error ?? `Failed to send ghost message (${res.status})`)
    }
    return res.json()
  },

  /**
   * Send a message and stream the response via SSE.
   * Used for progressive rendering of ghost responses.
   */
  async sendMessageStreaming(
    conversationId: string,
    content: string,
    callbacks: GhostStreamCallbacks,
  ): Promise<void> {
    const res = await fetch(`/api/ghosts/conversations/${conversationId}/messages/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as any
      callbacks.onError(body.error ?? `Stream failed (${res.status})`)
      return
    }

    const reader = res.body?.getReader()
    if (!reader) {
      callbacks.onError('No response body')
      return
    }

    const decoder = new TextDecoder()
    let fullContent = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        // Parse SSE lines
        const lines = text.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              callbacks.onComplete(fullContent)
              return
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.chunk) {
                fullContent += parsed.chunk
                callbacks.onChunk(parsed.chunk)
              }
            } catch {
              // Non-JSON data line, append as text chunk
              fullContent += data
              callbacks.onChunk(data)
            }
          }
        }
      }
      callbacks.onComplete(fullContent)
    } catch (err) {
      callbacks.onError(err instanceof Error ? err.message : 'Stream error')
    }
  },

  /**
   * List all ghost conversations for the current user.
   */
  async listConversations(): Promise<GhostConversation[]> {
    const res = await fetch('/api/ghosts/conversations')
    if (!res.ok) {
      throw new Error(`Failed to list ghost conversations (${res.status})`)
    }
    const data = (await res.json()) as any
    return data.conversations ?? []
  },

  /**
   * Delete a ghost conversation.
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const res = await fetch(`/api/ghosts/conversations/${conversationId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      throw new Error(`Failed to delete ghost conversation (${res.status})`)
    }
  },
}
