declare module 'lucide-react-native' {
  import { ComponentType } from 'react';

  export interface LucideProps {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
    style?: object;
  }

  export type LucideIcon = ComponentType<LucideProps>;

  export const Activity: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const Bell: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Database: LucideIcon;
  export const Droplet: LucideIcon;
  export const Home: LucideIcon;
  export const Info: LucideIcon;
  export const Leaf: LucideIcon;
  export const LogOut: LucideIcon;
  export const Plus: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Settings: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const Sliders: LucideIcon;
  export const Sun: LucideIcon;
  export const Thermometer: LucideIcon;
  export const Users: LucideIcon;
  export const Wind: LucideIcon;
  export const X: LucideIcon;
  export const Zap: LucideIcon;
  export const UserCheck: LucideIcon;
  export const Sparkles: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Cpu: LucideIcon;
}
