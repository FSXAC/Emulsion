import { 
  Film, 
  Camera, 
  Check, 
  CheckCircle, 
  Beaker, 
  Star, 
  Calendar, 
  DollarSign, 
  Clock, 
  Users, 
  Zap, 
  Edit, 
  Trash2, 
  Lightbulb, 
  Image,
  X,
  AlertTriangle,
  RotateCw,
  Copy,
  Download,
  Search,
  HelpCircle,
  Info,
  ArrowRight,
  BarChart3,
  Menu
} from 'lucide-react';

/**
 * Centralized icon component that provides semantic icon names
 * mapped to lucide-react icons. This makes it easy to maintain
 * consistent iconography across the app.
 */
const iconMap = {
  // Status & Navigation
  'film': Film,
  'camera': Camera,
  'check': Check,
  'checkCircle': CheckCircle,
  'chemistry': Beaker,
  'star': Star,
  'chart': BarChart3,
  
  // UI Actions
  'calendar': Calendar,
  'dollar': DollarSign,
  'clock': Clock,
  'users': Users,
  'zap': Zap,
  'edit': Edit,
  'trash': Trash2,
  'lightbulb': Lightbulb,
  'image': Image,
  'close': X,
  'x': X,
  'warning': AlertTriangle,
  'rotate': RotateCw,
  'copy': Copy,
  'download': Download,
  'search': Search,
  'help': HelpCircle,
  'info': Info,
  'arrowRight': ArrowRight,
  'menu': Menu,
};

export default function Icon({ name, className = '', size = 16, ...props }) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }
  
  return <IconComponent className={className} size={size} {...props} />;
}

// Export the map for direct access if needed
export { iconMap };
