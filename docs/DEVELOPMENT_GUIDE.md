# 개발 가이드

이 프로젝트의 기술 스택, 아키텍처, 개발 패턴을 정리한 가이드입니다.

---

## 기술 스택 선택 이유

| 기술 | 이유 |
|------|------|
| **Next.js 16 App Router** | Server Component로 초기 로딩 빠름, SEO 유리 |
| **tRPC v11** | 타입 안전한 API, REST 없이 프론트-백 타입 공유 |
| **Prisma 5** | 타입 안전한 ORM, 스키마 기반 마이그레이션 |
| **NextAuth v5** | JWT 기반 인증, credentials provider로 이메일/비밀번호 |
| **Supabase PostgreSQL** | 무료 클라우드 DB, Prisma와 연동 용이 |
| **shadcn/ui** | 복사 붙여넣기 방식, 커스터마이징 쉬움 |

---

## 프로젝트 구조

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── boards/
│   │   ├── page.tsx            # 게시판 목록
│   │   └── [slug]/
│   │       ├── page.tsx        # 게시글 목록
│   │       ├── write/page.tsx  # 글 작성
│   │       └── [postId]/
│   │           ├── page.tsx    # 글 상세
│   │           └── edit/page.tsx
│   ├── profile/[username]/page.tsx
│   ├── ranking/page.tsx
│   └── settings/page.tsx
│
├── components/
│   ├── layout/                 # Header, Footer
│   ├── boards/                 # 게시판 관련 컴포넌트
│   ├── profile/                # 프로필 관련
│   ├── settings/               # 설정 관련
│   ├── ranking/                # 랭킹 관련
│   └── ui/                     # shadcn/ui 컴포넌트
│
├── server/
│   ├── db/
│   │   └── prisma.ts           # Prisma 클라이언트 싱글톤
│   └── trpc/
│       ├── index.ts            # tRPC 초기화, context, 미들웨어
│       ├── router.ts           # 루트 라우터 (모든 라우터 병합)
│       ├── caller.ts           # Server Component용 caller
│       └── routers/
│           ├── auth.router.ts
│           ├── board.router.ts
│           ├── post.router.ts
│           ├── comment.router.ts
│           ├── vote.router.ts
│           ├── riot.router.ts
│           ├── notification.router.ts
│           └── user.router.ts
│
└── lib/
    ├── auth.ts                 # NextAuth 설정
    ├── trpc/
    │   ├── client.ts           # 클라이언트 tRPC
    │   └── provider.tsx        # TRPCReactProvider
    └── validators/             # Zod 스키마
```

---

## tRPC 패턴

### Server Component에서 데이터 fetching
```typescript
// Server Component (page.tsx)
import { getCaller } from "@/server/trpc/caller";

export default async function Page() {
  const caller = await getCaller();
  const data = await caller.router.procedure();
  return <Component data={data} />;
}
```

### Client Component에서 사용
```typescript
// Client Component
"use client";
import { trpc } from "@/lib/trpc/client";

export function Component() {
  const { data } = trpc.router.procedure.useQuery();
  const mutation = trpc.router.procedure.useMutation({
    onSuccess: () => utils.router.procedure.invalidate(),
  });
}
```

### 라우터 구조
```typescript
// 공개 프로시저
export const router = createTRPCRouter({
  publicProcedure: publicProcedure.query(async ({ ctx }) => { ... }),
  protectedProcedure: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id!; // ! 필요
  }),
});
```

---

## NextAuth v5 설정 패턴

### JWT에 커스텀 필드 추가
```typescript
callbacks: {
  jwt({ token, user }) {
    if (user) {
      token.id = user.id;
      token.role = (user as { role?: string }).role;
      token.username = (user as { name?: string }).name;
    }
    return token;
  },
  session({ session, token }) {
    if (token && session.user) {
      session.user.id = token.id as string;
      (session.user as { role?: string }).role = token.role as string;
      session.user.name = (token.username as string) ?? session.user.name;
    }
    return session;
  },
},
```

### 권한 보호 패턴
```typescript
// Server Component에서 리다이렉트
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // ...
}

// tRPC에서 미들웨어로 보호
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
export const adminProcedure = t.procedure.use(enforceUserIsAdmin);
```

---

## 알림 시스템 패턴

알림은 댓글/투표 라우터에서 side effect로 생성:

```typescript
// comment.router.ts - 댓글 생성 후 알림 트리거
await ctx.prisma.notification.create({
  data: {
    userId: post.authorId,        // 알림 받을 사람
    type: "COMMENT_REPLY",
    title: "새 댓글",
    body: `${author.username}님이 댓글을 달았습니다`,
    linkUrl: `/boards/${board.slug}/${postId}`,
  },
});
```

클라이언트에서 30초 폴링:
```typescript
trpc.notification.getUnreadCount.useQuery(undefined, {
  refetchInterval: 30_000,
});
```

---

## Vercel 배포 체크리스트

1. **로컬 빌드 먼저 확인**
   ```bash
   npm run build
   ```

2. **package.json build 스크립트**
   ```json
   "build": "prisma generate && next build"
   ```

3. **환경변수 (Vercel Dashboard → Settings → Environment Variables)**
   - `DATABASE_URL` — Supabase connection pooling URL
   - `DIRECT_URL` — Supabase direct URL
   - `AUTH_SECRET` — NextAuth 시크릿
   - `NEXTAUTH_URL` — 배포된 도메인 (e.g. `https://xxx.vercel.app`)
   - `RIOT_API_KEY` — Riot 개발키 (24시간 만료 주의)
   - `RIOT_API_REGION` — `kr`

4. **GitHub push → Vercel 자동 재배포**

---

## Git 커밋 컨벤션

```
feat: 새 기능 추가
fix: 버그 수정
docs: 문서 수정
chore: 설정, 의존성 변경
refactor: 코드 리팩토링
style: 스타일 변경
test: 테스트 추가
```

예시:
```bash
git add src/components/settings/
git commit -m "feat: add profile settings with password change"
git push
```

---

## 개발 시작 명령어

```bash
# 의존성 설치
npm install

# DB 마이그레이션
npx prisma migrate dev

# 시드 데이터 (게시판 초기 데이터)
npx prisma db seed

# 개발 서버
npm run dev

# Prisma Studio (DB GUI)
npx prisma studio
```
