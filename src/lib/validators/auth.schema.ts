import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요."),
  username: z
    .string()
    .min(2, "닉네임은 2자 이상이어야 합니다.")
    .max(20, "닉네임은 20자 이하여야 합니다.")
    .regex(/^[a-zA-Z0-9가-힣_]+$/, "닉네임은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다."),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다.")
    .max(100, "비밀번호는 100자 이하여야 합니다."),
});

export const loginSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
