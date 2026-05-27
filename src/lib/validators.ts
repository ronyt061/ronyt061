import { z } from "zod";

export const StatusEnum = z.enum(["open", "pending", "resolved"]);
export const PriorityEnum = z.enum(["low", "normal", "high", "urgent"]);
export const ChannelEnum = z.enum(["email", "form", "api"]);

export const LoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const RegisterInput = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1)
});

export const TicketPatch = z.object({
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
  assignee_id: z.string().nullable().optional(),
  asset_id: z.string().nullable().optional(),
  subject: z.string().min(1).optional()
});

export const NewMessage = z.object({
  body: z.string().min(1),
  kind: z.enum(["reply", "note"]).default("reply")
});

export const NewTicket = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  contact_email: z.string().email(),
  contact_name: z.string().optional(),
  channel: ChannelEnum.default("api"),
  priority: PriorityEnum.optional()
});

export const NewAsset = z.object({
  name: z.string().min(1),
  kind: z.string().min(1),
  identifier: z.string().optional(),
  notes: z.string().optional()
});

export const TagInput = z.object({
  name: z.string().min(1).max(40)
});
