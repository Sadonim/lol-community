# 프로젝트 진행 기록

LOL 커뮤니티 프로젝트의 전체 개발 과정과 주요 결정 사항을 기록합니다.

---

## 개발 타임라인

### Phase 1 — 인증 (로그인/회원가입)
**구현 내용**
- NextAuth v5 + Credentials Provider (이메일/비밀번호)
- bcrypt 비밀번호 해싱
- JWT 세션 전략
- 로그인/회원가입 페이지 + 폼 유효성 검사 (Zod)

**주요 결정**
- OAuth 대신 Credentials 선택 → Riot 계정 연동을 별도로 관리하기 위해
- JWT 전략 → 서버 세션보다 Vercel 환경에 적합

---

### Phase 2 — Riot 계정 연동 및 소환사 검색
**구현 내용**
- Riot Games API 연동 (계정 조회, 소환사 정보, 랭크 정보)
- Supabase PostgreSQL 셋업 및 Prisma 스키마 설계
- 전체 DB 스키마 설계 (User, RiotAccount, Board, Post, Comment, Vote, Tag, Notification)

**주요 결정**
- 스키마를 미리 전체 설계 → 나중에 마이그레이션 충돌 방지
- Supabase 선택 → 무료 플랜, pgbouncer 연결 풀링 지원

---

### Phase 3 — 포럼 (게시판/글/댓글/투표)
**구현 내용 (7단계로 진행)**
- 3-1: tRPC 라우터 4개 (board, post, comment, vote) + Zod 스키마
- 3-2: shadcn/ui 컴포넌트 추가 (textarea, separator, select, skeleton, dialog)
- 3-3: 게시판 목록 페이지
- 3-4: 게시글 목록 + 페이지네이션 + 태그 뱃지
- 3-5: 글 작성/수정 페이지 + TagSelector
- 3-6: 글 상세 + VoteButtons + CommentSection (대댓글)
- 3-7: 시드 데이터 (게시판 5개 — 자유, 공략, 팀원모집, 질문, 유머)

**주요 결정**
- `unstable_cache`로 게시판 목록 캐싱 (60초) → 자주 바뀌지 않는 데이터
- 대댓글은 `parentId` 자기 참조로 구현 (무한 depth 가능하지만 UI는 1단계만)

---

### Phase 4 — 알림 시스템
**구현 내용**
- notification.router.ts (list, getUnreadCount, markRead, markAllRead)
- 댓글 생성 시 글 작성자 + 원댓글 작성자에게 알림 자동 생성
- 좋아요 시 글 작성자에게 알림 (본인 제외)
- 헤더 NotificationBell 컴포넌트 (30초 폴링, 드롭다운)

**주요 결정**
- 실시간 WebSocket 대신 30초 폴링 선택 → Vercel 무료 플랜에서 WebSocket 미지원
- 본인 행동은 알림 제외 (UX)

---

### Phase 5 — 프로필/설정/랭킹
**구현 내용**
- user.router.ts (getProfile, updateProfile, changePassword)
- riot.router.ts에 getRanking 추가 (티어 → 분류 → LP 정렬)
- 공개 프로필 페이지 `/profile/[username]`
- 설정 페이지 `/settings` (닉네임, 비밀번호, Riot 연동)
- 랭킹 페이지 `/ranking`

**주요 트러블슈팅**
- 한글 username URL 파라미터 404 → `decodeURIComponent` 적용
- NextAuth 세션에 username 누락 → JWT 콜백에서 `token.username` 명시 저장

---

### 배포 — Vercel
**진행 과정**
1. GitHub repo 생성 (Sadonim/lol-community)
2. git init → commit → push
3. Vercel GitHub 연동 → 환경변수 설정 → Deploy

**배포 중 발생한 에러**
1. RiotAccount 인터페이스 타입 불일치 → 누락 필드 추가
2. `userId: string | undefined` 타입 오류 → `!` assertion
3. Prisma Client 미생성 오류 → `prisma generate && next build`

---

## DB 스키마 설계 결정 사항

### UserRole
```
USER → 일반 유저
MODERATOR → 중간 관리자 (글/댓글 삭제)
ADMIN → 최고 관리자 (게시판 관리, 유저 role 변경)
```
현재는 USER/ADMIN만 활용. MODERATOR는 추후 기능 확장 시 사용 예정.

### Vote 구조
```
Vote {
  userId, postId (nullable), commentId (nullable)
  @@unique([userId, postId])   // 한 유저가 같은 글에 1표
  @@unique([userId, commentId]) // 한 유저가 같은 댓글에 1표
}
```
`value: 1` = 좋아요, `value: -1` = 싫어요 (현재 좋아요만 사용)

### Notification linkUrl
알림 클릭 시 이동할 URL을 DB에 저장:
```
/boards/{slug}/{postId}
```
댓글/투표 알림 모두 해당 게시글로 이동.

---

## 앞으로 고려할 기능

| 기능 | 우선순위 | 비고 |
|------|----------|------|
| 최근 게임 기록 | 높음 | Riot Match API 활용 |
| 소환사 검색 | 중간 | Phase 2 기반 있음 |
| 팀원 구하기 게시판 | 중간 | 기존 게시판 구조 활용 |
| 관리자 페이지 | 낮음 | adminProcedure 이미 준비됨 |
| Rate limiting | 낮음 | 브루트포스 방지 |
| 이미지 업로드 | 낮음 | Supabase Storage 활용 |
