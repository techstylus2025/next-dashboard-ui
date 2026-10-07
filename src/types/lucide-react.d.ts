declare module "lucide-react" {
  import * as React from "react";

  export type LucideProps = React.SVGProps<SVGSVGElement> & {
    size?: number | string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
  };

  export type LucideIcon = React.ForwardRefExoticComponent<LucideProps & React.RefAttributes<SVGSVGElement>>;

  export const CalendarDays: LucideIcon;
  export const ChartColumn: LucideIcon;
  export const GraduationCap: LucideIcon;
  export const Megaphone: LucideIcon;
  export const School: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Users: LucideIcon;
  export const ClipboardCheck: LucideIcon;
  export const BookOpen: LucideIcon;
  export const FileText: LucideIcon;
  export const Bell: LucideIcon;
  export const PlusCircle: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const NotebookPen: LucideIcon;
  export const Eye: LucideIcon;
  export const Pencil: LucideIcon;
  export const Trash2: LucideIcon;
  export const BadgeCheck: LucideIcon;
  export const Archive: LucideIcon;
  export const BookOpenCheck: LucideIcon;
  export const Boxes: LucideIcon;
  export const Building2: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const CircleDollarSign: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const Clock3: LucideIcon;
  export const ContactRound: LucideIcon;
  export const Layers3: LucideIcon;
  export const Mail: LucideIcon;
  export const MapPin: LucideIcon;
  export const Phone: LucideIcon;
  export const Search: LucideIcon;
  export const Settings2: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const ShoppingBag: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const UserRound: LucideIcon;
  export const WalletCards: LucideIcon;
}
