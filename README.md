<div align="center">

# ⚔️ LOL 커뮤니티

**리그 오브 레전드 유저를 위한 커뮤니티 포럼**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://lol-community-testbuild.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)

[🚀 라이브 데모](https://lol-community-testbuild.vercel.app) · [🐛 버그 제보](https://github.com/Sadonim/lol-community/issues) · [💡 기능 제안](https://github.com/Sadonim/lol-community/issues)

</div>

---

## 📸 스크린샷

> 스크린샷 추가 예정

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 📋 **게시판** | 자유, 공략, 팀원 모집 등 게시판별 글 작성 / 댓글 / 투표 |
| 🎮 **Riot 연동** | Riot ID로 소환사 티어·승률 자동 연동 |
| 🏆 **티어 랭킹** | 연동된 소환사들의 실시간 랭킹 |
| 🔔 **알림** | 댓글·답글·좋아요 실시간 알림 |
| 👤 **프로필** | 공개 프로필 페이지 및 계정 설정 |

---

## 🛠 기술 스택

<table>
  <tr>
    <td><b>Frontend</b></td>
    <td>Next.js 16 (App Router) · TypeScript · Tailwind CSS · shadcn/ui</td>
  </tr>
  <tr>
    <td><b>Backend</b></td>
    <td>tRPC v11 · NextAuth v5 (JWT) · Prisma 5</td>
  </tr>
  <tr>
    <td><b>Database</b></td>
    <td>PostgreSQL · Supabase</td>
  </tr>
  <tr>
    <td><b>External API</b></td>
    <td>Riot Games API</td>
  </tr>
  <tr>
    <td><b>Deployment</b></td>
    <td>Vercel</td>
  </tr>
</table>

---

## 🗂 프로젝트 구조

```
src/
├── app/                  # Next.js App Router 페이지
│   ├── boards/           # 게시판
│   ├── profile/          # 프로필
│   ├── ranking/          # 랭킹
│   └── settings/         # 설정
├── components/           # UI 컴포넌트
│   ├── layout/           # Header, Footer
│   ├── profile/          # 프로필 관련
│   ├── settings/         # 설정 관련
│   └── ranking/          # 랭킹 관련
└── server/
    └── trpc/routers/     # tRPC API 라우터
```

---

## 📋 환경변수

`.env.example` 파일을 참고하세요.

```bash
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
NEXTAUTH_URL=
RIOT_API_KEY=
RIOT_API_REGION=kr
```

---

## 💬 피드백

버그 제보나 기능 제안은 [Issues](https://github.com/Sadonim/lol-community/issues) 탭을 이용해주세요.
