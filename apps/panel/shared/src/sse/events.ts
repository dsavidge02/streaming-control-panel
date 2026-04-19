import { z } from "zod";

export const baseSseEventSchema = z.object({
	type: z.string(),
	data: z.unknown(),
});

export const heartbeatEventSchema = z.object({
	type: z.literal("heartbeat"),
	data: z.object({}).strict(),
});

export const sseEventSchema = z.discriminatedUnion("type", [
	heartbeatEventSchema,
]);

export type BaseSseEvent = z.infer<typeof baseSseEventSchema>;
export type HeartbeatEvent = z.infer<typeof heartbeatEventSchema>;
export type SseEvent = z.infer<typeof sseEventSchema>;
