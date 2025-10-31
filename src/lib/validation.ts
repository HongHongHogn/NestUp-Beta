import { z } from "zod";

export const signupSchema = z.object({
	name: z.string().min(1, "이름을 입력해주세요."),
	email: z.string().email("올바른 이메일 형식이 아닙니다."),
	password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
	email: z.string().email("올바른 이메일 형식이 아닙니다."),
	password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export type LoginInput = z.infer<typeof loginSchema>;
