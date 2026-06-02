export function getInitials(name: string) {
  const parts = name?.trim()?.split(" ") ?? [];
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarColor(name: string) {
  const code = (name || "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const colors = ["bg-sky-500", "bg-indigo-500", "bg-emerald-500", "bg-rose-500", "bg-yellow-500", "bg-violet-500"];
  return colors[code % colors.length];
}

export default { getInitials, avatarColor };
