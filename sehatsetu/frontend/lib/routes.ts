/**
 * Central route helpers for SehatSetu role-based navigation and layout detection
 */

export function isDashboardRoute(pathname: string): boolean {
  if (pathname.startsWith('/dashboard')) return true;
  if (pathname === '/admin') return false;
  if (pathname.startsWith('/admin')) return true;
  if (pathname.startsWith('/professional')) {
    // /professional and /professional/onboarding are public onboarding pages
    if (pathname === '/professional' || pathname === '/professional/onboarding') {
      return false;
    }
    return true;
  }
  return false;
}

export function getRoleDashboardPath(role?: string): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'professional':
      return '/professional/dashboard';
    case 'patient':
    default:
      return '/dashboard';
  }
}
