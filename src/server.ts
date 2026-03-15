/**
 * Custom Server Entry Point
 * Exports Durable Objects and handles the TanStack Start server.
 * Referenced by wrangler.toml as the main entry point.
 */

// Export Durable Objects
export { ChatRoom } from '@/durable-objects/chat-room'
export { NotificationHub } from '@/durable-objects/notification-hub'
export { UploadManager } from '@/durable-objects/upload-manager'

// Import the TanStack Start server
import startServer from '@tanstack/react-start/server-entry'

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const response: Response = await (startServer as any).fetch(request, env, ctx)
    return response
  },
}
