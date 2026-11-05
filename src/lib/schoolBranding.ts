import prisma from "@/lib/prisma";
import {
  DEFAULT_SCHOOL_LOGO,
  DEFAULT_SCHOOL_NAME,
} from "@/lib/schoolBrandingDefaults";

export { DEFAULT_SCHOOL_LOGO, DEFAULT_SCHOOL_NAME };

export type SchoolBranding = {
  name: string;
  logoUrl: string;
};

export async function getSchoolBranding(): Promise<SchoolBranding> {
  const settings = await prisma.schoolSetting.findFirst({
    select: { name: true, logoUrl: true },
  });

  return {
    name: settings?.name?.trim() || DEFAULT_SCHOOL_NAME,
    logoUrl: settings?.logoUrl?.trim() || DEFAULT_SCHOOL_LOGO,
  };
}
