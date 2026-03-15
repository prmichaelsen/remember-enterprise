import { createFileRoute } from '@tanstack/react-router'
import { initFirebaseAdmin } from '@/lib/firebase-admin'
import { getServerSession } from '@/lib/auth/session'
import { GhostDatabaseService } from '@/services/ghost-database.service'
import {
  getDocument,
  queryDocuments,
} from '@prmichaelsen/firebase-admin-sdk-v8'
import { ChatEngine } from '@/lib/chat/chat-engine'
import { AnthropicAIProvider } from '@/lib/chat/anthropic-ai-provider'
import { buildGhostSystemPrompt } from '@/lib/chat/prompt-builder'
import type { GhostPersona, GhostMessage } from '@/services/ghost.service'
import type { MemoryRecord } from '@/lib/chat/prompt-builder'

export const Route = createFileRoute(
  '/api/ghosts/conversations/$conversationId/messages/stream',
)({
  server: {
    handlers: {
      POST: async ({
        request,
        params,
      }: {
        request: Request
        params: { conversationId: string }
      }) => {
        initFirebaseAdmin()

        // Auth guard
        const session = await getServerSession(request)
        if (!session) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { conversationId } = params
        if (!conversationId) {
          return Response.json(
            { error: 'conversationId is required' },
            { status: 400 },
          )
        }

        // Parse body
        let body: { content?: string }
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        const { content } = body
        if (!content || typeof content !== 'string' || !content.trim()) {
          return Response.json(
            { error: 'content is required and must be a non-empty string' },
            { status: 400 },
          )
        }

        // Load conversation to verify it exists and get ghostId
        const convPath = `users/${session.uid}/ghost_conversations`
        let conversationDoc: Record<string, unknown> | null
        try {
          conversationDoc = await getDocument(convPath, conversationId)
        } catch {
          conversationDoc = null
        }

        if (!conversationDoc) {
          return Response.json(
            { error: 'Conversation not found' },
            { status: 404 },
          )
        }

        const ghostId = conversationDoc.ghostId as string

        // Load ghost persona
        const defaultGhost: GhostPersona = {
          id: ghostId,
          name: 'Assistant',
          description: 'A helpful assistant.',
          avatarUrl: '',
          trustTier: 'public',
          systemPromptFragment: 'You are a helpful assistant.',
          createdAt: new Date().toISOString(),
        }
        let ghost: GhostPersona = defaultGhost
        try {
          const ghostDoc = await getDocument('ghosts', ghostId)
          if (ghostDoc) {
            ghost = { ...(ghostDoc as unknown as GhostPersona), id: ghostId }
          }
        } catch {
          // Ghost may have been deleted; proceed with default
        }

        // Load conversation history (last 50 messages)
        const messagesPath = `users/${session.uid}/ghost_conversations/${conversationId}/messages`
        let history: GhostMessage[] = []
        try {
          const messageDocs = await queryDocuments(messagesPath, {
            orderBy: [{ field: 'createdAt', direction: 'ASCENDING' }],
            limit: 50,
          })
          history = messageDocs.map((doc) => ({
            ...(doc.data as unknown as GhostMessage),
            id: doc.id,
          }))
        } catch {
          // Proceed with empty history if query fails
        }

        // Persist user message and get memory context
        const { memoryContext } = await GhostDatabaseService.sendMessage(
          session.uid,
          conversationId,
          { role: 'user', content },
        )

        // Build system prompt using prompt-builder (Task 30)
        const memoryRecords: MemoryRecord[] = memoryContext.map((m: any) => ({
          id: m.id ?? '',
          title: m.title ?? '',
          content: m.content ?? m.text ?? JSON.stringify(m),
          scope: m.scope,
          created_at: m.created_at ?? m.createdAt,
        }))

        const systemPrompt = buildGhostSystemPrompt({
          ghostPersona: ghost,
          memoryContext: memoryRecords,
        })

        // Check for API key
        const apiKey =
          (typeof process !== 'undefined'
            ? process.env.ANTHROPIC_API_KEY
            : undefined) ?? (globalThis as any).env?.ANTHROPIC_API_KEY

        if (!apiKey) {
          return Response.json(
            { error: 'Anthropic API key is not configured' },
            { status: 500 },
          )
        }

        // Build messages array for the chat engine
        const chatMessages = history.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }))
        chatMessages.push({ role: 'user', content })

        // Create the AI provider and chat engine
        const provider = new AnthropicAIProvider(apiKey)
        const engine = new ChatEngine(provider)

        // Stream response as SSE
        let fullAssistantContent = ''

        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder()

            try {
              await engine.processMessage({
                messages: chatMessages,
                systemPrompt,
                onEvent(event) {
                  if (event.type === 'chunk') {
                    fullAssistantContent += event.content
                    const sseData = `data: ${JSON.stringify({ chunk: event.content })}\n\n`
                    controller.enqueue(encoder.encode(sseData))
                  } else if (event.type === 'error') {
                    const sseError = `data: ${JSON.stringify({ error: event.error })}\n\n`
                    controller.enqueue(encoder.encode(sseError))
                  }
                },
              })

              // Stream complete — send done signal
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))

              // Persist assistant message
              try {
                await GhostDatabaseService.sendMessage(
                  session.uid,
                  conversationId,
                  { role: 'assistant', content: fullAssistantContent },
                )
              } catch (err) {
                console.error(
                  '[ghost-stream] Failed to persist assistant message:',
                  err,
                )
              }

              controller.close()
            } catch (err) {
              console.error('[ghost-stream] Stream error:', err)
              const errorMsg =
                err instanceof Error ? err.message : 'Internal stream error'
              const sseError = `data: ${JSON.stringify({ error: errorMsg })}\n\n`
              controller.enqueue(encoder.encode(sseError))
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
            }
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        })
      },
    },
  },
})
