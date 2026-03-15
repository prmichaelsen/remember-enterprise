/**
 * useWebSocket hook — React binding for WebSocketManager.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { WebSocketManager, setupVisibilityRecovery } from '@/lib/websocket-manager'
import type { WebSocketMessage } from '@/types/websocket'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export function useWebSocket(conversationId: string | null) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const managerRef = useRef<WebSocketManager | null>(null)

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
    managerRef.current?.send(message)
  }, [])

  return { status, lastMessage, send }
}
