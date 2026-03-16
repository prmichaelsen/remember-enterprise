/**
 * Shared type definitions for Remember Enterprise.
 * Types-first approach: define contracts upfront, implement against them.
 * Accept TypeScript errors in consuming code until implementations land.
 */

// Re-export all domain types
export type { Conversation, ConversationType, Message, MessageContent, ContentBlock } from './conversations'
export type { MemoryItem, MemoryScope, MemoryFeedAlgorithm, MemoryFeedParams } from './memories'
export type { Notification, NotificationType, NotificationPreferences } from './notifications'
export type { WebSocketMessage, WebSocketMessageType, WebSocketConfig } from './websocket'
export type { AuthUser } from '../components/auth/AuthContext'
