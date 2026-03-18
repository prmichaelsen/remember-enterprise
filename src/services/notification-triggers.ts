/**
 * Notification Triggers — logic that creates notifications in response
 * to application events (new DM, group message, @agent response, @mention).
 *
 * Each trigger:
 *  1. Creates a persistent notification via NotificationService
 *  2. Broadcasts to the user's NotificationHub Durable Object for real-time delivery
 *  3. Optionally sends an FCM push notification (if the user has push enabled)
 */

import type { Notification } from '@/types/notifications'
import {
  createNotification,
  type CreateNotificationParams,
} from './notification.service'

// ---------------------------------------------------------------------------
// Broadcast helper — sends event to NotificationHub Durable Object
// ---------------------------------------------------------------------------

interface BroadcastContext {
  /** Cloudflare env binding for NotificationHub DO */
  notificationHub?: {
    idFromName: (name: string) => { toString: () => string }
    get: (id: unknown) => { fetch: (req: Request | string, init?: RequestInit) => Promise<Response> }
  }
  /** Base URL for internal DO fetch calls */
  origin?: string
}

async function broadcastToUser(
  userId: string,
  notification: Notification,
  ctx: BroadcastContext,
): Promise<void> {
  if (!ctx.notificationHub) return

  const doId = ctx.notificationHub.idFromName(userId)
  const stub = ctx.notificationHub.get(doId)

  const event = {
    type: 'new_notification',
    data: {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      conversation_id: notification.conversation_id,
    },
  }

  try {
    await stub.fetch(new Request(`${ctx.origin ?? 'http://internal'}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }))
  } catch {
    // Non-critical — real-time delivery failed, notification persists in DB
  }
}

// ---------------------------------------------------------------------------
// FCM push helper (stub — implemented fully in Task 16)
// ---------------------------------------------------------------------------

async function sendPushNotification(
  _userId: string,
  notification: Notification,
): Promise<void> {
  // Stub: In production, this calls Firebase Admin SDK to send FCM push.
  // The fcm.ts module handles token retrieval; server-side push uses
  // firebase-admin to send to the user's registered device tokens.
  void notification
}

// ---------------------------------------------------------------------------
// Core trigger function
// ---------------------------------------------------------------------------

async function triggerNotification(
  params: CreateNotificationParams,
  ctx: BroadcastContext = {},
): Promise<Notification> {
  // 1. Persist notification
  const notification = await createNotification(params)

  // 2. Real-time broadcast via WebSocket
  await broadcastToUser(params.user_id, notification, ctx)

  // 3. FCM push (best-effort)
  await sendPushNotification(params.user_id, notification).catch(() => {})

  return notification
}

// ---------------------------------------------------------------------------
// Trigger: New Direct Message
// ---------------------------------------------------------------------------

export interface NewDMTriggerParams {
  recipientUserId: string
  senderName: string
  messagePreview: string
  conversationId: string
}

export async function triggerNewDMNotification(
  params: NewDMTriggerParams,
  ctx?: BroadcastContext,
): Promise<Notification> {
  return triggerNotification(
    {
      user_id: params.recipientUserId,
      type: 'new_dm',
      title: `New message from ${params.senderName}`,
      body: params.messagePreview.length > 120
        ? params.messagePreview.slice(0, 117) + '...'
        : params.messagePreview,
      conversation_id: params.conversationId,
    },
    ctx,
  )
}

// ---------------------------------------------------------------------------
// Trigger: Group Message
// ---------------------------------------------------------------------------

export interface GroupMessageTriggerParams {
  recipientUserId: string
  senderName: string
  groupName: string
  messagePreview: string
  conversationId: string
}

export async function triggerGroupMessageNotification(
  params: GroupMessageTriggerParams,
  ctx?: BroadcastContext,
): Promise<Notification> {
  return triggerNotification(
    {
      user_id: params.recipientUserId,
      type: 'group_message',
      title: `${params.senderName} in ${params.groupName}`,
      body: params.messagePreview.length > 120
        ? params.messagePreview.slice(0, 117) + '...'
        : params.messagePreview,
      conversation_id: params.conversationId,
    },
    ctx,
  )
}

// ---------------------------------------------------------------------------
// Trigger: @Agent Response
// ---------------------------------------------------------------------------

export interface AgentResponseTriggerParams {
  recipientUserId: string
  agentName: string
  responsePreview: string
  conversationId: string
}

export async function triggerAgentResponseNotification(
  params: AgentResponseTriggerParams,
  ctx?: BroadcastContext,
): Promise<Notification> {
  return triggerNotification(
    {
      user_id: params.recipientUserId,
      type: 'agent_response',
      title: `${params.agentName} responded`,
      body: params.responsePreview.length > 120
        ? params.responsePreview.slice(0, 117) + '...'
        : params.responsePreview,
      conversation_id: params.conversationId,
    },
    ctx,
  )
}

// ---------------------------------------------------------------------------
// Trigger: @Mention
// ---------------------------------------------------------------------------

export interface MentionTriggerParams {
  recipientUserId: string
  mentionerName: string
  context: string
  conversationId: string
}

export async function triggerMentionNotification(
  params: MentionTriggerParams,
  ctx?: BroadcastContext,
): Promise<Notification> {
  return triggerNotification(
    {
      user_id: params.recipientUserId,
      type: 'mention',
      title: `${params.mentionerName} mentioned you`,
      body: params.context.length > 120
        ? params.context.slice(0, 117) + '...'
        : params.context,
      conversation_id: params.conversationId,
    },
    ctx,
  )
}

// ---------------------------------------------------------------------------
// Trigger: Thread Reply
// ---------------------------------------------------------------------------

export interface ThreadReplyTriggerParams {
  recipientUserId: string
  senderName: string
  parentMessagePreview: string
  replyPreview: string
  conversationId: string
  parentMessageId: string
  replyMessageId: string
}

export async function triggerThreadReplyNotification(
  params: ThreadReplyTriggerParams,
  ctx?: BroadcastContext,
): Promise<Notification> {
  return triggerNotification(
    {
      user_id: params.recipientUserId,
      type: 'thread_reply',
      title: `${params.senderName} replied in thread`,
      body: params.replyPreview.length > 120
        ? params.replyPreview.slice(0, 117) + '...'
        : params.replyPreview,
      conversation_id: params.conversationId,
      metadata: {
        parent_message_id: params.parentMessageId,
        reply_message_id: params.replyMessageId,
        parent_message_preview: params.parentMessagePreview.substring(0, 80),
      },
    },
    ctx,
  )
}
