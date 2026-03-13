# 에러 & 해결 모음

이 프로젝트에서 실제로 발생한 에러들과 해결 방법을 기록합니다.

---

## 1. 한글 URL 파라미터 404 오류

**증상**
- `/profile/갤주` 접속 시 404
- DB에는 `갤주`로 저장되어 있는데 쿼리가 실패

**원인**
Next.js App Router에서 동적 라우트 파라미터(`[username]`)는 URL 인코딩된 상태로 전달된다.
- 브라우저 요청: `/profile/갤주`
- Next.js가 전달하는 params: `%EA%B0%A4%EC%A3%BC` (URL 인코딩)
- DB 저장값: `갤주` (UTF-8)
- 결과: DB 쿼리 미스매치 → 404

**디버깅 방법**
```typescript
// page.tsx에 로그 추가
const raw = rawUsername;
const hex = Buffer.from(raw).toString('hex');
console.log('raw:', raw, 'hex:', hex);
// 출력: raw: %EA%B0%A4%EC%A3%BC hex: 254541...
// DB값: hex: eab0a4eca3bc (전혀 다름)
```

**해결**
```typescript
// src/app/profile/[username]/page.tsx
const { username: rawUsername } = await params;
const username = decodeURIComponent(rawUsername); // 반드시 추가
```

**교훈**
- 한글, 일본어, 특수문자 등 비ASCII 문자를 URL 파라미터로 쓸 때는 항상 `decodeURIComponent` 적용
- Next.js 16.x (Turbopack)에서 동적 라우트는 자동 디코딩 안 됨

---

## 2. NextAuth 세션에 커스텀 필드 누락

**증상**
- 헤더의 "내 프로필" 링크가 `/profile/undefined`로 이동
- `session.user.name`이 undefined

**원인**
NextAuth v5에서 JWT에 커스텀 필드를 추가하려면 `jwt` 콜백에서 명시적으로 저장해야 한다.
기본 `user.name`은 NextAuth가 자동으로 처리하지 않음.

**해결**
```typescript
// src/lib/auth.ts
callbacks: {
  jwt({ token, user }) {
    if (user) {
      token.id = user.id;
      token.role = (user as { role?: string }).role;
      token.username = (user as { name?: string }).name; // 명시적 저장
    }
    return token;
  },
  session({ session, token }) {
    if (token && session.user) {
      session.user.id = token.id as string;
      session.user.name = (token.username as string) ?? session.user.name; // 복원
    }
    return session;
  },
},
```

**교훈**
- NextAuth v5에서 세션에 커스텀 데이터(role, username 등)를 넣으려면 `jwt` → `session` 콜백 두 곳 모두 설정
- 로그인 후 세션을 확인할 때는 브라우저 개발자 도구 → Application → Cookies → `next-auth.session-token` 디코딩

---

## 3. Vercel 배포 시 Prisma 클라이언트 오류

**증상**
```
PrismaClientInitializationError: Prisma has detected that this project was built on Vercel,
which caches dependencies. This leads to an outdated Prisma Client...
```

**원인**
Vercel은 빌드 시 `node_modules`를 캐싱한다.
Prisma Client는 `node_modules/.prisma/client`에 스키마 기반으로 생성되는데,
캐시로 인해 최신 스키마가 반영되지 않아 초기화 실패.

**해결**
```json
// package.json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

**교훈**
- Prisma를 쓰는 모든 프로젝트의 Vercel 배포 시 필수 설정
- 로컬에서는 `prisma generate`가 자동으로 실행되어 문제없지만, Vercel에서는 명시적으로 필요

---

## 4. tRPC `string | undefined` 타입 오류

**증상**
```
Type error: Type 'string | undefined' is not assignable to type 'string'
(Prisma create data 객체에서 발생)
```

**원인**
`protectedProcedure`를 사용해도 TypeScript는 `ctx.session.user.id`를 `string | undefined`로 추론.
Prisma는 외래키 필드에 `string`만 허용.

**해결**
```typescript
// Non-null assertion 사용
const userId = ctx.session.user.id!;
// protectedProcedure가 보장하므로 런타임에서 undefined 불가
```

**교훈**
- `protectedProcedure`는 런타임에서 세션을 보장하지만 TypeScript 타입 추론은 이를 모름
- `!` assertion 또는 명시적 타입 가드 중 선택

---

## 5. tRPC import 오류 (api vs trpc)

**증상**
```
Export 'api' doesn't exist in target module
```

**원인**
클라이언트 컴포넌트에서 `api`를 import했지만 실제 export 이름은 `trpc`

**해결**
```typescript
// 잘못된 것
import { api } from "@/lib/trpc/client";

// 올바른 것
import { trpc } from "@/lib/trpc/client";
```

---

## 6. settings 페이지 모듈 not found

**증상**
```
Module not found: Can't resolve '@/server/auth'
```

**원인**
auth 관련 파일 경로를 잘못 import

**해결**
```typescript
// 잘못된 것
import { auth } from "@/server/auth";

// 올바른 것
import { auth } from "@/lib/auth";
```

---

## 7. GitHub push 충돌 (fetch first)

**증상**
```
error: failed to push some refs
hint: Updates were rejected because the remote contains work that you do not have locally
```

**원인**
GitHub에서 repo 생성 시 README를 자동 생성하면, 로컬과 원격에 서로 다른 커밋이 존재

**해결**
```bash
git pull origin main --allow-unrelated-histories
# vim 편집창 뜨면 :wq 입력
git push -u origin main
```

---

## 8. RiotAccount 인터페이스 타입 불일치

**증상**
```
Type 'RiotAccount' is missing the following properties from type '...': summonerLevel, profileIconId
```

**원인**
클라이언트 컴포넌트에서 정의한 로컬 `RiotAccount` 인터페이스에 필드가 누락됨

**해결**
tRPC가 반환하는 타입과 로컬 인터페이스를 일치시킴:
```typescript
interface RiotAccount {
  gameName: string;
  tagLine: string;
  summonerLevel: number | null; // 누락되어 있던 필드
  profileIconId: number | null; // 누락되어 있던 필드
  tier: string | null;
  // ...
}
```

**교훈**
- 클라이언트 컴포넌트에서 로컬 타입을 직접 정의하는 대신, tRPC의 `RouterOutputs` 타입을 활용하면 자동으로 동기화됨:
```typescript
import type { RouterOutputs } from "@/lib/trpc/client";
type RiotAccount = RouterOutputs["riot"]["myAccount"];
```
