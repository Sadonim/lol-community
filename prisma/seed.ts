import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const boards = [
    { slug: "free", name: "자유게시판", description: "자유롭게 이야기를 나눠보세요.", sortOrder: 1 },
    { slug: "strategy", name: "공략게시판", description: "챔피언 공략 및 운영 전략을 공유해보세요.", sortOrder: 2 },
    { slug: "champion", name: "챔피언 토론", description: "챔피언에 대한 다양한 의견을 나눠보세요.", sortOrder: 3 },
    { slug: "team", name: "팀 모집", description: "같이 게임할 팀원을 모집해보세요.", sortOrder: 4 },
    { slug: "humor", name: "유머게시판", description: "웃긴 게임 순간들을 공유해보세요.", sortOrder: 5 },
  ];

  for (const board of boards) {
    await prisma.board.upsert({
      where: { slug: board.slug },
      update: {},
      create: board,
    });
  }

  console.log(`✅ ${boards.length}개 게시판 시드 완료`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
