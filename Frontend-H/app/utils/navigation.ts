import type { UserRole } from '~/types';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

const management: UserRole[] = ['admin', 'manager'];
const staff: UserRole[] = ['admin', 'manager', 'receptionist'];
const items: NavigationItem[] = [
  { id: 'users', label: 'Usuarios', href: '/admin/settings?tab=users', icon: 'system-uicons:users', roles: ['admin'] },
  { id: 'settings', label: 'Configuración', href: '/admin/settings', icon: 'system-uicons:settings', roles: ['admin'] },
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'system-uicons:grid', roles: management },
  { id: 'rooms', label: 'Habitaciones', href: '/rooms', icon: 'system-uicons:home', roles: management },
  { id: 'reservations', label: 'Reservas', href: '/reservations', icon: 'system-uicons:calendar', roles: management },
  { id: 'payments', label: 'Pagos', href: '/payments', icon: 'system-uicons:coin', roles: management },
  { id: 'reports', label: 'Reportes', href: '/reports', icon: 'system-uicons:graph-bar', roles: management },
  { id: 'clients', label: 'Clientes', href: '/clients', icon: 'system-uicons:users', roles: staff },
  { id: 'checkin', label: 'Check-in/out', href: '/checkin', icon: 'system-uicons:lock', roles: staff },
  { id: 'my-reservations', label: 'Mis Reservas', href: '/reservations', icon: 'system-uicons:calendar', roles: ['receptionist'] },
];

export const getNavigationItems = (role?: UserRole) => role ? items.filter(item => item.roles.includes(role)) : [];
