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
}
