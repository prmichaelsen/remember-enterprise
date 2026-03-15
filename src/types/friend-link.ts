import { z } from 'zod'

export const FriendLinkSchema = z.object({
  code: z.string(),
  created_by_user_id: z.string(),
  url: z.string(),
  expires_at: z.string().nullable(),
  max_uses: z.number().int().min(1).nullable(),
  use_count: z.number().int().min(0),
  created_at: z.string(),
})

export type FriendLink = z.infer<typeof FriendLinkSchema>
