require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();

    await client.query(`INSERT INTO "Admin" (id, username) VALUES ('admin1','admin1') ON CONFLICT (id) DO NOTHING;`);
    await client.query(`INSERT INTO "Admin" (id, username) VALUES ('admin2','admin2') ON CONFLICT (id) DO NOTHING;`);

    const gradeRows = await client.query('SELECT id, level FROM "Grade" ORDER BY id');
    const gradeByLevel = Object.fromEntries(gradeRows.rows.map((row) => [row.level, row.id]));

    const classSeeds = [
      { name: 'Creche A', gradeId: gradeByLevel.CRECHE, capacity: 20 },
      { name: 'Nursery A', gradeId: gradeByLevel.NURSERY, capacity: 22 },
      { name: 'Primary A', gradeId: gradeByLevel.PRIMARY, capacity: 25 },
    ];

    for (const item of classSeeds) {
      await client.query('INSERT INTO "Class" (name, capacity, "gradeId", "gradingLevel") VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING', [item.name, item.capacity, item.gradeId, 'PRIMARY']);
    }

    const classIds = (await client.query('SELECT id FROM "Class" ORDER BY id')).rows.map((row) => row.id);
    const gradeIds = gradeRows.rows.map((row) => row.id);

    for (let i = 1; i <= 5; i++) {
      await client.query(`INSERT INTO "Teacher" (id, username, name, surname, email, phone, address, "bloodType", sex, birthday) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`, [
        `teacher${i}`,
        `teacher${i}`,
        `TName${i}`,
        `TSurname${i}`,
        `teacher${i}@example.com`,
        `123-456-789${i}`,
        `Address${i}`,
        'A+',
        i % 2 === 0 ? 'MALE' : 'FEMALE',
        new Date(2000, 0, 1),
      ]);
    }

    for (let i = 1; i <= 25; i++) {
      await client.query(`INSERT INTO "Parent" (id, username, name, surname, email, phone, address) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`, [
        `parentId${i}`,
        `parentId${i}`,
        `PName ${i}`,
        `PSurname ${i}`,
        `parent${i}@example.com`,
        `123-456-789${i}`,
        `Address${i}`,
      ]);
    }

    for (let i = 1; i <= 50; i++) {
      const birthday = new Date();
      birthday.setFullYear(birthday.getFullYear() - 10);
      await client.query(`INSERT INTO "Student" (id, username, name, surname, email, phone, address, "bloodType", sex, "parentId", "gradeId", "classId", birthday) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT (id) DO NOTHING`, [
        `student${i}`,
        `student${i}`,
        `SName${i}`,
        `SSurname ${i}`,
        `student${i}@example.com`,
        `987-654-321${i}`,
        `Address${i}`,
        'O-',
        i % 2 === 0 ? 'MALE' : 'FEMALE',
        `parentId${Math.ceil(i / 2) % 25 || 25}`,
        gradeIds[(i - 1) % gradeIds.length],
        classIds[(i - 1) % classIds.length] ?? 1,
        birthday,
      ]);
    }

    console.log('seeded direct records');
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
