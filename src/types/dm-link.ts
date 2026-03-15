import { z } from 'zod'

export const DmLinkSchema = z.object({
  code: z.string(),
  created_by_user_id: z.string(),
  url: z.string(),
  max_uses: z.literal(1),
  use_count: z.number().int().min(0),
  created_at: z.string(),
})

export type DmLink = z.infer<typeof DmLinkSchema>
