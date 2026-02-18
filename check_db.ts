import prisma from "./src/config/prisma";
async function check() {
  const problems = await prisma.problem.findMany({ select: { id: true, title: true } });
  const problem1 = await prisma.problem.findUnique({ where: { id: 1 } });
  console.log("Problem 1 Examples:", JSON.stringify(problem1?.examples, null, 2));
  
}
check();
