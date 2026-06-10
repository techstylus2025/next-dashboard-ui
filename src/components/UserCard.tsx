import { getActiveAcademicPeriod } from "@/lib/academicContext";
import prisma from "@/lib/prisma";
import { userCardTheme } from "@/lib/dashboardTheme";
import Image from "next/image";
import Link from "next/link";

type UserCardType = "admin" | "teacher" | "student" | "parent";

const getCardLink = (type: UserCardType): string => {
  switch (type) {
    case "admin":
      return "/list/settings";
    case "teacher":
      return "/list/teachers";
    case "student":
      return "/list/students";
    case "parent":
      return "/list/parents";
    default:
      return "/admin";
  }
};

const UserCard = async ({ type }: { type: UserCardType }) => {
  const data =
    type === "admin"
      ? await prisma.admin.count()
      : type === "teacher"
        ? await prisma.teacher.count()
        : type === "student"
          ? await prisma.student.count()
          : await prisma.parent.count();

  const theme = userCardTheme[type];
  const period = await getActiveAcademicPeriod();
  const link = getCardLink(type);

  return (
    <Link href={link}>
      <div
        className={`rounded-2xl p-4 flex-1 min-w-[130px] transition-transform hover:scale-[1.02] cursor-pointer ${theme.card}`}
      >
        <div className="flex justify-between items-center">
          <span
            className={`text-[10px] px-2 py-1 rounded-full font-medium max-w-[7rem] truncate ${theme.badge}`}
            title={
              period.termStart && period.termEnd
                ? `${period.yearLabel ?? ""} · Term ${period.termNumber}: ${period.termStart.toLocaleDateString()} – ${period.termEnd.toLocaleDateString()}`
                : period.yearLabel ?? period.badge
            }
          >
            {period.badge}
          </span>
          <Image
            src="/more.png"
            alt=""
            width={20}
            height={20}
            className="opacity-90 brightness-0 invert"
          />
        </div>
        <h1 className={`text-2xl font-semibold my-4 ${theme.count}`}>{data}</h1>
        <h2 className={`capitalize text-sm font-medium ${theme.label}`}>
          {type}s
        </h2>
      </div>
    </Link>
  );
};

export default UserCard;
