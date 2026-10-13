"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentAuthContext } from "@/lib/auth";
import { getYouTubeVideoId, type LearningResourceType } from "@/lib/learningResources";

const documentExtensions = new Set([
  "csv",
  "doc",
  "docx",
  "odt",
  "pdf",
  "ppt",
  "pptx",
  "rtf",
  "txt",
  "xls",
  "xlsx",
  "zip",
]);
const imageExtensions = new Set(["gif", "jpeg", "jpg", "png", "webp"]);

const isCloudinaryAsset = (
  value: string,
  resourceTypes: ("image" | "raw")[]
): boolean => {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      resourceTypes.some((resourceType) => url.pathname.includes(`/${resourceType}/upload/`))
    );
  } catch {
    return false;
  }
};

function getAssetFileName(assetUrl: string): string | null {
  try {
    const url = new URL(assetUrl);
    const filename = url.pathname.split("/").pop();
    return filename ? decodeURIComponent(filename) : null;
  } catch {
    return null;
  }
}

export async function createLessonLearningResource(data: {
  title: string;
  classId: number | null;
  type: LearningResourceType;
  assetUrl: string;
  fileName?: string;
}) {
  const { userId, role } = await getCurrentAuthContext();
  if (!userId || role !== "admin") {
    return { success: false, message: "Only administrators can upload learning resources." };
  }

  if (!data || typeof data !== "object") {
    return { success: false, message: "Enter valid learning resource details." };
  }

  const title = typeof data.title === "string" ? data.title.trim() : "";
  const classId = data.classId === null ? null : Number(data.classId);
  const type = data.type;
  const assetUrl = typeof data.assetUrl === "string" ? data.assetUrl.trim() : "";
  let fileName = typeof data.fileName === "string" ? data.fileName.trim() : "";
  let normalizedAssetUrl = assetUrl;

  if (
    !title ||
    title.length > 200 ||
    (classId !== null && (!Number.isInteger(classId) || classId <= 0))
  ) {
    return { success: false, message: "Enter a title and choose a valid resource audience." };
  }
  if (!["DOCUMENT", "IMAGE", "YOUTUBE"].includes(type) || !assetUrl) {
    return { success: false, message: "Choose a valid resource type and upload or link." };
  }

  if (type === "YOUTUBE") {
    const videoId = getYouTubeVideoId(assetUrl);
    if (!videoId) {
      return { success: false, message: "Enter a valid YouTube video link." };
    }
    normalizedAssetUrl = `https://www.youtube.com/watch?v=${videoId}`;
  } else {
    const assetFileName = getAssetFileName(assetUrl);
    if (!/\.[a-z0-9]+$/i.test(fileName) && assetFileName && /\.[a-z0-9]+$/i.test(assetFileName)) {
      fileName = fileName ? `${fileName}.${assetFileName.split(".").pop()}` : assetFileName;
    }
    const extension = fileName.split(".").pop()?.toLowerCase();
    const allowedExtensions = type === "IMAGE" ? imageExtensions : documentExtensions;
    if (
      !fileName ||
      fileName.length > 255 ||
      !extension ||
      !allowedExtensions.has(extension)
    ) {
      return {
        success: false,
        message: type === "IMAGE"
          ? "Choose a valid JPG, PNG, GIF, or WebP image."
          : "Choose a PDF, text, presentation, spreadsheet, or ZIP document.",
      };
    }
    const allowedCloudinaryTypes: ("image" | "raw")[] = type === "IMAGE"
      ? ["image"]
      : extension === "pdf"
        ? ["raw", "image"]
        : ["raw"];
    if (!isCloudinaryAsset(assetUrl, allowedCloudinaryTypes)) {
      return {
        success: false,
        message: "The uploaded file could not be verified in cloud storage. Please upload it again.",
      };
    }
  }

  try {
    if (classId !== null) {
      const classRecord = await prisma.class.findUnique({ where: { id: classId }, select: { id: true } });
      if (!classRecord) {
        return { success: false, message: "The selected class could not be found." };
      }
    }

    await prisma.lessonLearningResource.create({
      data: {
        title,
        classId,
        type,
        assetUrl: normalizedAssetUrl,
        fileName: type === "YOUTUBE" ? null : fileName,
        uploadedBy: userId,
      },
    });

    revalidatePath("/list/learning-resources");
    return { success: true };
  } catch (error) {
    console.error("createLessonLearningResource failed:", error);
    return { success: false, message: "Unable to save the learning resource. Please try again." };
  }
}

export async function deleteLessonLearningResource(resourceId: number) {
  const { userId, role } = await getCurrentAuthContext();
  if (!userId || role !== "admin") {
    return { success: false, message: "Only administrators can delete learning resources." };
  }

  if (!Number.isInteger(resourceId) || resourceId <= 0) {
    return { success: false, message: "Choose a valid learning resource." };
  }

  try {
    const resource = await prisma.lessonLearningResource.findUnique({
      where: { id: resourceId },
      select: { id: true },
    });
    if (!resource) {
      return { success: false, message: "This learning resource no longer exists." };
    }

    await prisma.lessonLearningResource.delete({ where: { id: resourceId } });
    revalidatePath("/list/learning-resources");
    return { success: true };
  } catch (error) {
    console.error("deleteLessonLearningResource failed:", error);
    return { success: false, message: "Unable to delete the learning resource. Please try again." };
  }
}
