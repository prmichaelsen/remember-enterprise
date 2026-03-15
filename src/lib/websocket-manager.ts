/**
 * WebSocket Manager — auto-reconnect with exponential backoff,
 * page visibility recovery, and typed message protocol.
 */

import type { WebSocketMessage, WebSocketConfig } from '@/types/websocket'

type MessageHandler = (message: WebSocketMessage) => void
type StatusHandler = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void

export class WebSocketManager {
  private ws: WebSocket | null = null
  private config: WebSocketConfig
  private messageHandlers: Set<MessageHandler> = new Set()
  private statusHandlers: Set<StatusHandler> = new Set()
  private retryCount = 0
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private disposed = false

  constructor(config: WebSocketConfig) {
    this.config = config
  }

  connect() {
    if (this.disposed) return
    this.setStatus('connecting')

    try {
      this.ws = new WebSocket(this.config.url)

      this.ws.onopen = () => {
        this.retryCount = 0
        this.setStatus('connected')
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          for (const handler of this.messageHandlers) {
            handler(message)
          }
        } catch {
          // Invalid JSON — ignore
        }
      }

      this.ws.onclose = () => {
        this.setStatus('disconnected')
        this.scheduleReconnect()
      }

      this.ws.onerror = () => {
        this.setStatus('error')
      }
    } catch {
      this.setStatus('error')
      this.scheduleReconnect()
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler)
    return () => this.statusHandlers.delete(handler)
  }

  dispose() {
    this.disposed = true
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.ws?.close()
    this.messageHandlers.clear()
    this.statusHandlers.clear()
  }

  private setStatus(status: 'connecting' | 'connected' | 'disconnected' | 'error') {
    for (const handler of this.statusHandlers) {
      handler(status)
    }
  }

  private scheduleReconnect() {
    if (this.disposed) return
    if (this.retryCount >= this.config.reconnectMaxRetries) return

    const delay = Math.min(
      this.config.reconnectBaseDelay * Math.pow(2, this.retryCount),
      this.config.reconnectMaxDelay,
    )
    this.retryCount++
    this.retryTimer = setTimeout(() => this.connect(), delay)
  }
}

/**
 * Page visibility recovery — reconnect WebSocket when tab becomes visible.
 */
export function setupVisibilityRecovery(manager: WebSocketManager): () => void {
  const handler = () => {
    if (document.visibilityState === 'visible') {
      manager.connect()
    }
  }
  document.addEventListener('visibilitychange', handler)
  return () => document.removeEventListener('visibilitychange', handler)
}
