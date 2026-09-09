import prisma from "../src/lib/prisma";

async function findDuplicates() {
  try {
    const admins = await prisma.admin.findMany({ select: { id: true } });
    const teachers = await prisma.teacher.findMany({ select: { id: true } });
    const parents = await prisma.parent.findMany({ select: { id: true } });
    const students = await prisma.student.findMany({ select: { id: true } });

    const map = new Map<string, string[]>();

    const add = (id: string, role: string) => {
      if (!id) return;
      const arr = map.get(id) || [];
      if (!arr.includes(role)) arr.push(role);
      map.set(id, arr);
    };

    admins.forEach((a) => add(a.id, "admin"));
    teachers.forEach((t) => add(t.id, "teacher"));
    parents.forEach((p) => add(p.id, "parent"));
    students.forEach((s) => add(s.id, "student"));

    const duplicates = Array.from(map.entries()).filter(([, roles]) => roles.length > 1);

    if (duplicates.length === 0) {
      console.log("No duplicate user IDs across role tables found.");
    } else {
      console.log(`Found ${duplicates.length} duplicated user id(s):`);
      duplicates.forEach(([id, roles]) => {
        console.log(`- ${id}: ${roles.join(", ")}`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error("Error scanning role tables:", err);
    process.exit(2);
  } finally {
    await prisma.$disconnect();
  }
}

findDuplicates();
