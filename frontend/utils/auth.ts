import Cookies from 'js-cookie';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  type: 'admin' | 'team_member';
  team?: {
    teamId: string;
    teamName: string;
  };
}

export const getToken = (): string | null => {
  return Cookies.get('token') || null;
};

export const getUser = (): User | null => {
  const userStr = Cookies.get('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setAuth = (token: string, user: User): void => {
  Cookies.set('token', token, { expires: 7 }); // 7 days
  Cookies.set('user', JSON.stringify(user), { expires: 7 });
};

export const clearAuth = (): void => {
  Cookies.remove('token');
  Cookies.remove('user');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const isAdmin = (): boolean => {
  const user = getUser();
  return user?.type === 'admin';
};

export const isSuperAdmin = (): boolean => {
  const user = getUser();
  return user?.type === 'admin' && user?.role === 'SUPER_ADMIN';
};

export const isDocumentAdmin = (): boolean => {
  const user = getUser();
  return user?.type === 'admin' && (user?.role === 'SUPER_ADMIN' || user?.role === 'DOCUMENT_ADMIN');
};

export const isTeamMember = (): boolean => {
  const user = getUser();
  return user?.type === 'team_member';
};
