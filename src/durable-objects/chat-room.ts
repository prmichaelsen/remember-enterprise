/**
 * ChatRoom Durable Object
 *
 * Manages WebSocket connections for conversations and delegates to ChatEngine
 * for AI processing. Ported from agentbase.me architecture.
 *
 * Flow: Client → WebSocket → ChatRoom DO → ChatEngine → AI → WebSocket back
 */

import { DurableObject } from 'cloudflare:workers'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { ChatEngine } from '@/lib/chat/chat-engine'
import { AnthropicAIProvider } from '@/lib/chat/anthropic-ai-provider'
import { MCPProvider } from '@/lib/chat/mcp-provider'
import { MessageDatabaseService } from '@/services/message-database.service'
import { ConversationDatabaseService } from '@/services/conversation-database.service'
import { detectAgentMention, shouldAgentRespond } from '@/lib/chat/agent-mention'
import { getTextContent } from '@/lib/message-content'
import { createLogger } from '@/lib/logger'
import { getDocument, setDocument } from '@prmichaelsen/firebase-admin-sdk-v8'
import type { Message, MessageContent } from '@/types/conversations'
import type { StreamEvent } from '@/lib/chat/types'

const log = createLogger('ChatRoom')
const ANON_MESSAGE_LIMIT = 10

interface ClientMessage {
  type: 'message' | 'load_messages' | 'init' | 'cancel'
  message?: MessageContent
  userId: string
  conversationId?: string
  /** Ghost owner user ID for ghost/persona conversations (e.g., 'space:the_void') */
  ghostOwner?: string
  limit?: number
  startAfter?: string
}

interface ServerMessage {
  type: string
  [key: string]: unknown
}

export class ChatRoom extends DurableObject {
  private sessions: Map<WebSocket, string> = new Map()
  private sessionConversations: Map<WebSocket, string> = new Map()
  private activeControllers: Map<string, AbortController> = new Map()
  private mcpProvider: MCPProvider
  private request?: Request
  private anonCache: Map<string, boolean> = new Map()

  constructor(state: DurableObjectState, env: Env) {
    super(state, env)
    initFirebaseAdmin()
    this.mcpProvider = new MCPProvider()
    log.info('ChatRoom initialized')
  }

  async fetch(request: Request): Promise<Response> {
    this.request = request
    const url = new URL(request.url)

    // HTTP endpoint for server-initiated broadcasts (backward compat)
    if (url.pathname === '/broadcast' && request.method === 'POST') {
      try {
        const message = await request.json() as ServerMessage
        this.broadcastToAll(message)
        return new Response('OK', { status: 200 })
      } catch {
        return new Response('Invalid JSON', { status: 400 })
      }
    }

    // Verify WebSocket upgrade
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 })
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    server.accept()

    server.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data as string) as ClientMessage

        if (!this.sessions.has(server) && data.userId) {
          this.sessions.set(server, data.userId)
        }

        switch (data.type) {
          case 'init':
            await this.handleInit(data, server)
            break
          case 'message':
            await this.handleMessage(data, server)
            break
          case 'load_messages':
            await this.handleLoadMessages(data, server)
            break
          case 'cancel':
            this.handleCancel(data, server)
            break
          default:
            log.warn('Unknown message type', { type: (data as any).type })
        }
      } catch (error) {
        log.error({ err: error }, 'Error handling WebSocket message')
        this.sendMsg(server, { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
      }
    })

    server.addEventListener('close', () => {
      this.sessions.delete(server)
      this.sessionConversations.delete(server)
    })

    return new Response(null, { status: 101, webSocket: client })
  }

  private async handleInit(data: ClientMessage, socket: WebSocket): Promise<void> {
    const { userId, conversationId, ghostOwner } = data

    if (userId) {
      this.sessions.set(socket, userId)
    }
    if (conversationId) {
      this.sessionConversations.set(socket, conversationId)
    }

    // Load and send message history
    if (conversationId && userId) {
      try {
        const conversationType = await this.getConversationType(userId, conversationId)

        // Send conversation type to client
        this.sendMsg(socket, { type: 'conversation_type', conversationType })

        const result = await MessageDatabaseService.listMessages(
          conversationId,
          50,
          undefined,
          userId,
          conversationType === 'chat' ? undefined : conversationType,
        )

        // Messages come newest-first, reverse for chronological
        const messages = result.messages.reverse()

        this.sendMsg(socket, {
          type: 'messages_loaded',
          messages,
          hasMore: result.has_more,
        })
      } catch (error) {
        log.error({ err: error }, 'Init: failed to load messages')
      }
    }

    // Inform reconnecting client if a stream is active
    if (conversationId && this.activeControllers.has(conversationId)) {
      this.sendMsg(socket, { type: 'generation_in_progress' })
    }

    this.sendMsg(socket, { type: 'ready' })
  }

  private async handleMessage(data: ClientMessage, socket: WebSocket): Promise<void> {
    const { userId, conversationId = 'main', message, ghostOwner } = data

    if (!message) {
      this.sendMsg(socket, { type: 'error', error: 'No message provided' })
      return
    }

    if (conversationId) {
      this.sessionConversations.set(socket, conversationId)
    }

    // Abort any in-flight generation
    const existingController = this.activeControllers.get(conversationId)
    if (existingController) {
      existingController.abort()
      this.activeControllers.delete(conversationId)
    }

    const controller = new AbortController()
    this.activeControllers.set(conversationId, controller)

    const conversationType = await this.getConversationType(userId, conversationId)

    // === ANONYMOUS MESSAGE LIMIT VALIDATION ===
    const isAnonymous = await this.checkIfAnonymous(userId)

    if (isAnonymous) {
      const stats = await this.getUserStats(userId)
      const currentCount = stats?.count ?? 0

      if (currentCount >= ANON_MESSAGE_LIMIT) {
        // Reject message — limit reached
        this.sendMsg(socket, {
          type: 'error',
          error: 'limit_reached',
          message: `You've sent ${ANON_MESSAGE_LIMIT} messages. Sign up to continue!`,
          signupUrl: `/auth?mode=signup&redirect_url=${encodeURIComponent('/')}`,
        })

        log.info({ userId, currentCount }, 'Anonymous message limit reached')
        return // Early return — don't process message
      }

      // If we reach here, validation passed
      log.debug({ userId, currentCount }, 'Anonymous user under limit')
    }
    // === END VALIDATION ===

    // Save user message to Firestore
    const savedMessage = await MessageDatabaseService.sendMessage(
      conversationId,
      {
        sender_user_id: userId,
        content: message,
        role: 'user',
      },
      conversationType === 'chat' ? undefined : conversationType,
    )

    // === INCREMENT MESSAGE COUNT FOR ANONYMOUS USERS ===
    if (isAnonymous && savedMessage) {
      // Fire-and-forget increment (don't await to avoid blocking)
      this.incrementMessageCount(userId).catch((err) => {
        log.error({ err, userId, messageId: savedMessage.id }, 'Increment failed (non-critical)')
      })
    }
    // === END INCREMENT ===

    // Broadcast saved user message to all clients viewing this conversation
    this.broadcastMessage({ type: 'message', message: savedMessage }, conversationId)

    // Update conversation last_message metadata
    try {
      const preview = getTextContent(savedMessage.content)
      await ConversationDatabaseService.updateLastMessage(
        conversationId,
        {
          content: preview.substring(0, 200),
          sender_user_id: userId,
          timestamp: savedMessage.timestamp,
        },
        userId,
        conversationType === 'chat' ? undefined : conversationType,
      )
    } catch (err) {
      log.error({ err }, 'Failed to update conversation last_message')
    }

    // Check if agent should respond
    const hasAgentMention = detectAgentMention(message)
    const agentShouldRespond = shouldAgentRespond(conversationType, hasAgentMention)

    if (!agentShouldRespond) {
      this.broadcastMessage({ type: 'complete' }, conversationId)
      this.activeControllers.delete(conversationId)
      return
    }

    // Load conversation history for AI
    const historyResult = await MessageDatabaseService.listMessages(
      conversationId,
      50,
      undefined,
      userId,
      conversationType === 'chat' ? undefined : conversationType,
    )
    const history = historyResult.messages.reverse()

    // Build chat messages for ChatEngine — filter out empty/system messages
    const chatMessages = history
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: getTextContent(msg.content),
      }))
      .filter((msg) => msg.content.trim() !== '')

    // Build a basic system prompt
    const systemPrompt = 'You are a helpful AI assistant. Be concise and accurate.'

    // Get API key
    const apiKey = (this.env as any).ANTHROPIC_API_KEY as string | undefined
    if (!apiKey) {
      this.broadcastMessage({ type: 'error', error: 'Anthropic API key is not configured' }, conversationId)
      this.activeControllers.delete(conversationId)
      return
    }

    // Create ChatEngine and stream response
    const aiProvider = new AnthropicAIProvider(apiKey)
    const engine = new ChatEngine(aiProvider, { mcpProvider: this.mcpProvider, apiKey })

    let fullAssistantContent = ''

    try {
      await engine.processMessage({
        messages: chatMessages,
        systemPrompt,
        userId,
        ghostOwner,  // Pass space context to ChatEngine
        signal: controller.signal,
        onEvent: (event: StreamEvent) => {
          switch (event.type) {
            case 'chunk':
              fullAssistantContent += event.content
              this.broadcastMessage({ type: 'chunk', content: event.content }, conversationId)
              break
            case 'tool_call':
              this.broadcastMessage({
                type: 'tool_call',
                toolCall: { id: '', name: event.name, input: event.input },
              }, conversationId)
              break
            case 'tool_result':
              this.broadcastMessage({
                type: 'tool_result',
                toolResult: { id: '', output: event.result },
              }, conversationId)
              break
            case 'debug':
              // Send debug only to originating socket
              this.sendMsg(socket, { type: 'debug', debug: { step: event.message, data: event.data } })
              break
            case 'error':
              this.broadcastMessage({ type: 'error', error: event.error }, conversationId)
              break
            case 'complete':
              // Handled below after stream ends
              break
          }
        },
      })

      // Save assistant message
      // Use real userId for path routing so agent messages land in the same
      // user-scoped collection as user messages (for solo chat type).
      if (fullAssistantContent.trim()) {
        const assistantMessage = await MessageDatabaseService.sendMessage(
          conversationId,
          {
            sender_user_id: 'agent',
            content: fullAssistantContent,
            role: 'assistant',
            created_for_user_id: userId,
          },
          conversationType === 'chat' ? undefined : conversationType,
        )

        // Broadcast saved assistant message
        this.broadcastMessage({ type: 'message', message: assistantMessage }, conversationId)

        // Update conversation metadata
        try {
          await ConversationDatabaseService.updateLastMessage(
            conversationId,
            {
              content: fullAssistantContent.substring(0, 200),
              sender_user_id: 'agent',
              timestamp: assistantMessage.timestamp,
            },
            userId,
            conversationType === 'chat' ? undefined : conversationType,
          )
        } catch (err) {
          log.error({ err }, 'Failed to update conversation last_message after assistant response')
        }
      }

      this.broadcastMessage({ type: 'complete' }, conversationId)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.broadcastMessage({ type: 'cancelled' }, conversationId)
      } else {
        log.error({ err: error }, 'ChatEngine error')
        this.broadcastMessage({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        }, conversationId)
      }
    } finally {
      this.activeControllers.delete(conversationId)
    }
  }

  private handleCancel(data: ClientMessage, socket: WebSocket): void {
    const conversationId = data.conversationId || this.sessionConversations.get(socket) || 'main'

    const controller = this.activeControllers.get(conversationId)
    if (controller) {
      controller.abort()
      this.activeControllers.delete(conversationId)
      this.broadcastMessage({ type: 'cancelled' }, conversationId)
    }
  }

  private async handleLoadMessages(data: ClientMessage, socket: WebSocket): Promise<void> {
    const { userId, conversationId = 'main', limit = 50, startAfter, ghostOwner } = data

    try {
      const conversationType = await this.getConversationType(userId, conversationId)

      const result = await MessageDatabaseService.listMessages(
        conversationId,
        limit,
        startAfter,
        userId,
        conversationType === 'chat' ? undefined : conversationType,
      )

      const messages = result.messages.reverse()

      this.sendMsg(socket, {
        type: 'messages_loaded',
        messages,
        hasMore: result.has_more,
      })
    } catch (error) {
      log.error({ err: error }, 'Failed to load messages')
      this.sendMsg(socket, { type: 'error', error: 'Failed to load messages' })
    }
  }

  private async getConversationType(
    userId: string,
    conversationId: string,
  ): Promise<'dm' | 'group' | 'chat'> {
    // Check if this is a shared conversation (DM or group)
    try {
      const conv = await ConversationDatabaseService.getConversation(conversationId, userId)
      if (conv) {
        if (conv.type === 'dm') return 'dm'
        if (conv.type === 'group') return 'group'
      }
    } catch {
      // Ignore — default to chat
    }

    return 'chat'
  }

  private sendMsg(socket: WebSocket, message: ServerMessage): void {
    try {
      socket.send(JSON.stringify(message))
    } catch {
      // Client may have disconnected
    }
  }

  private broadcastMessage(message: ServerMessage, conversationId?: string): void {
    const visibleToUserIds = (message as any).message?.visible_to_user_ids

    for (const [socket, userId] of this.sessions.entries()) {
      if (conversationId) {
        const sessionConversationId = this.sessionConversations.get(socket)
        if (sessionConversationId !== conversationId) continue
      }

      if (visibleToUserIds && Array.isArray(visibleToUserIds)) {
        if (!visibleToUserIds.includes(userId)) continue
      }

      this.sendMsg(socket, message)
    }
  }

  private broadcastToAll(message: ServerMessage): void {
    for (const [socket] of this.sessions.entries()) {
      this.sendMsg(socket, message)
    }
  }

  /**
   * Get user stats document from Firestore
   * Path: agentbase.users/{uid}/stats/message_count
   */
  private async getUserStats(userId: string): Promise<{ count: number } | null> {
    try {
      const statsDoc = await getDocument(`agentbase.users/${userId}/stats`, 'message_count')
      if (!statsDoc) {
        return null
      }
      return { count: statsDoc.count ?? 0 }
    } catch (err) {
      log.error({ userId, err }, 'Failed to fetch user stats')
      return null
    }
  }

  /**
   * Increment message count for anonymous users
   * Uses atomic Firestore increment to prevent race conditions
   */
  private async incrementMessageCount(userId: string): Promise<void> {
    try {
      const collectionPath = `agentbase.users/${userId}/stats`

      // Use atomic increment via FieldValue.increment()
      // If document doesn't exist, Firestore creates it with count = 1
      await setDocument(
        collectionPath,
        'message_count',
        {
          count: { _increment: 1 },
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      )

      log.debug({ userId }, 'Message count incremented')
    } catch (err) {
      log.error({ userId, err }, 'Failed to increment message count')
      throw err
    }
  }

  /**
   * Check if user is anonymous based on their Firestore profile
   * Returns true if user has isAnonymous flag set, false otherwise
   * Defaults to false (safer) if profile can't be fetched
   * Uses caching to reduce Firestore reads
   */
  private async checkIfAnonymous(userId: string): Promise<boolean> {
    // Check cache first
    if (this.anonCache.has(userId)) {
      return this.anonCache.get(userId)!
    }

    // Query Firestore profile document
    try {
      const userDoc = await getDocument(`agentbase.users/${userId}`, 'profile')
      const isAnon = userDoc?.isAnonymous === true

      // Cache result
      this.anonCache.set(userId, isAnon)

      return isAnon
    } catch (err) {
      log.error({ userId, err }, 'Failed to check isAnonymous flag')
      // Default to non-anonymous on error (safer — don't block authenticated users)
      return false
    }
  }
}
