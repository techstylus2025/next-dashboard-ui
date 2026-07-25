import Image from "next/image";
import { getInitials, avatarColor } from "@/lib/attendanceUtils";

type AvatarProps = {
  src?: string | null;
  name: string;
  alt?: string;
  size?: number;
  className?: string;
};

export default function Avatar({
  src,
  name,
  alt = "Avatar",
  size = 40,
  className = "",
}: AvatarProps) {
  const initials = getInitials(name || "");

  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColor(
        name,
      )} ${className}`}
      style={{ width: size, height: size }}
    >
      {initials || "?"}
    </div>
  );
}
