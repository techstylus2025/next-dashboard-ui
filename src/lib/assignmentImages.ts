export const isCloudinaryAssignmentImage = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      /\/image\/upload\//i.test(url.pathname)
    );
  } catch {
    return false;
  }
};
