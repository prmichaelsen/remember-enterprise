/**
 * useWebSocket hook — React binding for WebSocketManager.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { WebSocketManager, setupVisibilityRecovery } from '@/lib/websocket-manager'
import type { WebSocketMessage } from '@/types/websocket'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseWebSocketParams {
  conversationId: string | null
  ghostOwner?: string
}

export function useWebSocket(params: UseWebSocketParams | string | null) {
  // Support both object and legacy string parameter
  const { conversationId, ghostOwner } = typeof params === 'string' || params === null
    ? { conversationId: params, ghostOwner: undefined }
    : params

  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const managerRef = useRef<WebSocketManager | null>(null)
  const ghostOwnerRef = useRef<string | undefined>(ghostOwner)

  // Update ghostOwnerRef when ghostOwner changes
  useEffect(() => {
    ghostOwnerRef.current = ghostOwner
  }, [ghostOwner])

  useEffect(() => {
    if (!conversationId) return

    const manager = new WebSocketManager({
      url: `/api/ws?conversationId=${conversationId}`,
      conversationId,
      reconnectMaxRetries: 10,
      reconnectBaseDelay: 1000,
      reconnectMaxDelay: 30000,
    })

    managerRef.current = manager

    const unsubMsg = manager.onMessage(setLastMessage)
    const unsubStatus = manager.onStatus(setStatus)
    const unsubVisibility = setupVisibilityRecovery(manager)

    manager.connect()

    return () => {
      unsubMsg()
      unsubStatus()
      unsubVisibility()
      manager.dispose()
      managerRef.current = null
    }
  }, [conversationId])

  const send = useCallback((message: WebSocketMessage) => {
    const enrichedMessage = {
      ...message,
      ...(ghostOwnerRef.current && { ghostOwner: ghostOwnerRef.current }),
    }
    managerRef.current?.send(enrichedMessage)
  }, [])

  return { status, lastMessage, send }
}
