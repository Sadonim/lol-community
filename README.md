<div align="center">

<img src="https://img.shields.io/badge/LOL-COMMUNITY-C89B3C?style=for-the-badge&labelColor=0A1428&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0M4OUIzQyI+PHBhdGggZD0iTTEyIDJMMyA3djEwbDkgNSA5LTVWN2wtOS01em0wIDIuMThsNyAzLjg5djcuODZsLTcgMy44OS03LTMuODlWOC4wN2w3LTMuODl6Ii8+PC9zdmc+" alt="LOL Community" />

<br />

# LOL 커뮤니티

**리그 오브 레전드 내전/클랜 유저를 위한 커뮤니티 포럼**

게시판 · Riot 계정 연동 · 티어 랭킹 · 전적 검색 · 알림

<br />

[![Deploy](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel&logoColor=white)](https://lol-community-testbuild.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![tRPC](https://img.shields.io/badge/tRPC-11-2596BE?style=flat-square&logo=trpc&logoColor=white)](https://trpc.io)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

<br />

[라이브 데모](https://lol-community-testbuild.vercel.app) · [버그 제보](https://github.com/Sadonim/lol-community/issues) · [기능 제안](https://github.com/Sadonim/lol-community/issues)

</div>

<br />

## 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [데이터 모델](#-데이터-모델)
- [시작하기](#-시작하기)
- [API 라우터](#-api-라우터)
- [Contributing](#-contributing)
- [License](#-license)

<br />

## ✨ 주요 기능

### 게시판

카테고리별 게시판(자유, 공략, 챔피언 토론, 팀 모집, 유머)에서 글 작성, 태그 필터링, 페이지네이션을 지원합니다. 최신순/조회순/인기순 정렬이 가능하며, 게시글 고정(pin) 기능과 관리자/운영자 권한 삭제를 포함합니다.

### 댓글 및 투표

게시글과 댓글에 좋아요/싫어요 투표를 할 수 있습니다. 댓글은 1-depth 대댓글을 지원하며, 투표 토글과 레이스 컨디션 방지를 위한 트랜잭션 처리가 적용되어 있습니다.

### Riot 계정 연동

Riot ID(게임 이름 + 태그라인)로 소환사 정보를 연동합니다. 솔로 랭크 티어, LP, 승률이 자동으로 가져와지며, 5분 쿨타임 기반의 최신 전적 동기화를 지원합니다.

### 전적 검색

로그인 없이도 Riot ID로 소환사의 티어, 랭크, 레벨, 승률을 검색할 수 있습니다. Riot Games API의 Account v1, Summoner v4, League v4 엔드포인트를 사용합니다.

### 티어 랭킹

Riot 계정을 연동한 유저들의 랭킹을 티어 > 디비전 > LP 순으로 정렬하여 보여줍니다.

### 알림

댓글 알림, 대댓글 알림, 게시글 좋아요 알림을 지원합니다. 본인 활동은 알림에서 제외되며, 개별/전체 읽음 처리가 가능합니다.

### 프로필 및 설정

공개 프로필 페이지에서 연동된 Riot 정보와 최근 게시글을 확인할 수 있습니다. 닉네임 변경, 아바타 URL 설정, 비밀번호 변경을 지원합니다.

<br />

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| **Framework** | Next.js 16 (App Router, React 19) |
| **Language** | TypeScript 5 |
| **API** | tRPC v11 + Tanstack React Query |
| **Auth** | NextAuth v5 (Credentials, JWT) |
| **ORM** | Prisma 5 |
| **Database** | PostgreSQL (Supabase) |
| **Styling** | Tailwind CSS 4 + shadcn/ui + Radix UI |
| **Validation** | Zod 4 |
| **State** | Zustand 5 |
| **Rate Limit** | Upstash Redis + Ratelimit |
| **External API** | Riot Games API (Account v1, Summoner v4, League v4) |
| **Deploy** | Vercel |

<br />

## 🗂 프로젝트 구조

```
lol-community/
├── prisma/
│   ├── schema.prisma            # DB 스키마 (User, RiotAccount, Board, Post, Comment, Vote, Tag, Notification)
│   ├── seed.ts                  # 기본 게시판 시드 데이터
│   └── migrations/              # 마이그레이션 파일
├── src/
│   ├── app/
│   │   ├── page.tsx             # 홈 (히어로 + 기능 카드)
│   │   ├── layout.tsx           # 루트 레이아웃 (SessionProvider, TRPCProvider, Header, Footer)
│   │   ├── (auth)/
│   │   │   ├── login/           # 로그인
│   │   │   └── register/        # 회원가입
│   │   ├── (forum)/boards/
│   │   │   ├── page.tsx         # 게시판 목록
│   │   │   └── [slug]/
│   │   │       ├── page.tsx     # 게시판 상세 (게시글 목록)
│   │   │       ├── write/       # 글 작성
│   │   │       └── [postId]/
│   │   │           ├── page.tsx # 게시글 상세
│   │   │           └── edit/    # 글 수정
│   │   ├── (riot)/search/       # 전적 검색
│   │   ├── ranking/             # 랭킹
│   │   ├── profile/[username]/  # 공개 프로필
│   │   ├── settings/            # 계정 설정
│   │   └── api/
│   │       ├── auth/[...nextauth]/ # NextAuth 핸들러
│   │       └── trpc/[...trpc]/     # tRPC 핸들러
│   ├── components/
│   │   ├── auth/                # LoginForm, RegisterForm
│   │   ├── forum/               # BoardCard, PostList, PostForm, CommentSection, VoteButtons, TagSelector 등
│   │   ├── layout/              # Header, Footer, NotificationBell
│   │   ├── profile/             # ProfileCard, TierBadge, UserPostList
│   │   ├── ranking/             # RankingTable
│   │   ├── riot/                # SearchForm, SummonerCard
│   │   ├── settings/            # ProfileForm, PasswordForm, RiotAccountSection
│   │   └── ui/                  # shadcn/ui 컴포넌트 (button, card, dialog, input 등)
│   ├── lib/
│   │   ├── auth.ts              # NextAuth 설정 (Credentials + JWT)
│   │   ├── utils.ts             # 유틸리티 (cn 등)
│   │   ├── constants/           # 페이지네이션 상수
│   │   ├── trpc/                # tRPC 클라이언트 + React Provider
│   │   └── validators/          # Zod 스키마 (auth, board, riot)
│   └── server/
│       ├── db/prisma.ts         # Prisma 클라이언트 싱글턴
│       ├── services/
│       │   └── riot.service.ts  # Riot Games API 호출 (fetch + 타임아웃 + 에러 처리)
│       └── trpc/
│           ├── index.ts         # tRPC 초기화 + 미들웨어 (public, protected, admin)
│           ├── router.ts        # 루트 라우터 (8개 서브 라우터 통합)
│           ├── caller.ts        # 서버 컴포넌트용 tRPC caller
│           └── routers/         # 서브 라우터 (auth, riot, board, post, comment, vote, notification, user)
├── package.json
├── next.config.ts
├── eslint.config.mjs
└── components.json              # shadcn/ui 설정
```

<br />

## 📊 데이터 모델

```
User ──┬── RiotAccount (1:1)     소환사 티어/LP/승률
       ├── Post[] ──┬── Comment[]    대댓글 1-depth
       │            ├── Vote[]       좋아요/싫어요
       │            └── PostTag[] ── Tag
       ├── Comment[]
       ├── Vote[]
       └── Notification[]           댓글/투표 알림

Board ── Post[]                     게시판별 게시글

UserRole: USER | MODERATOR | ADMIN
NotificationType: COMMENT_REPLY | POST_VOTE | COMMENT_VOTE | SYSTEM
```

<br />

## 🚀 시작하기

### 사전 요구사항

- **Node.js** 18 이상
- **PostgreSQL** 데이터베이스 (또는 [Supabase](https://supabase.com) 프로젝트)
- **Riot Games API Key** ([developer.riotgames.com](https://developer.riotgames.com)에서 발급)

### 설치

```bash
# 레포지토리 클론
git clone https://github.com/Sadonim/lol-community.git
cd lol-community

# 의존성 설치
npm install
```

### 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성합니다.

```bash
# Database (Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth
AUTH_SECRET="openssl rand -base64 32 로 생성"
NEXTAUTH_URL="http://localhost:3000"

# Riot Games API
RIOT_API_KEY="RGAPI-..."
RIOT_API_REGION="kr"
```

### 데이터베이스 설정

```bash
# Prisma 클라이언트 생성 + 마이그레이션 적용
npx prisma migrate dev

# 기본 게시판 시드 데이터 삽입 (자유, 공략, 챔피언 토론, 팀 모집, 유머)
npx prisma db seed
```

### 실행

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

`http://localhost:3000`에서 접속할 수 있습니다.

### 사용 가능한 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | Prisma 클라이언트 생성 + Next.js 프로덕션 빌드 |
| `npm start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |

<br />

## 🔌 API 라우터

tRPC v11 기반의 8개 서브 라우터로 구성됩니다. 인증이 필요한 프로시저는 JWT 세션 + DB 유저 존재 확인 미들웨어를 거칩니다.

| 라우터 | 주요 프로시저 | 접근 권한 |
|--------|--------------|-----------|
| `auth` | register, me | public / protected |
| `riot` | search, link, unlink, sync, myAccount, getRanking | public / protected |
| `board` | list, getBySlug, create | public / admin |
| `post` | list, getById, create, update, delete | public / protected |
| `comment` | listByPost, create, delete | public / protected |
| `vote` | toggle, getMyVote | protected |
| `notification` | list, getUnreadCount, markRead, markAllRead | protected |
| `user` | getProfile, updateProfile, changePassword | public / protected |

<br />

## 🤝 Contributing

1. 이 레포지토리를 Fork 합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feat/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m "feat: add amazing feature"`)
4. 브랜치에 Push 합니다 (`git push origin feat/amazing-feature`)
5. Pull Request를 생성합니다

버그 제보나 기능 제안은 [Issues](https://github.com/Sadonim/lol-community/issues)를 이용해주세요.

<br />

## 📄 License

MIT License. 자유롭게 사용하실 수 있습니다.
