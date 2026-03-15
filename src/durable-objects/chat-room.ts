import { DurableObject } from 'cloudflare:workers'

/**
 * ChatRoom Durable Object — manages WebSocket connections for a conversation.
 * Each conversation gets its own ChatRoom instance.
 */
export class ChatRoom extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/websocket') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 })
      }

      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair)
      this.ctx.acceptWebSocket(server)

      return new Response(null, { status: 101, webSocket: client })
    }

    return new Response('Not found', { status: 404 })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const data = typeof message === 'string' ? message : new TextDecoder().decode(message)

    // Broadcast to all connected clients
    for (const client of this.ctx.getWebSockets()) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    }
  }

  async webSocketClose(ws: WebSocket) {
    ws.close()
  }

  async webSocketError(ws: WebSocket) {
    ws.close()
  }
}
