import { z } from "zod";

export const heartbeatEventSchema = z.object({
	type: z.literal("heartbeat"),
	data: z.object({}).strict(),
});

export const sseEventSchema = z.discriminatedUnion("type", [
	heartbeatEventSchema,
]);

export type HeartbeatEvent = z.infer<typeof heartbeatEventSchema>;
export type SseEvent = z.infer<typeof sseEventSchema>;
