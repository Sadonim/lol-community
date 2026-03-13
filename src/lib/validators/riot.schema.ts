import { z } from "zod";

export const riotIdSchema = z.object({
  gameName: z
    .string()
    .min(1, "게임 이름을 입력해주세요.")
    .max(16, "게임 이름은 16자 이하여야 합니다.")
    .trim(),
  tagLine: z
    .string()
    .min(1, "태그라인을 입력해주세요.")
    .max(5, "태그라인은 5자 이하여야 합니다.")
    .trim(),
});

export type RiotIdInput = z.infer<typeof riotIdSchema>;
