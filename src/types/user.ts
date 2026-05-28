export interface User {
  id: string;
  name: string;
  role: 'ADMIN' | 'MONITOR';
  status: 'active' | 'inactive';
  avatar: string;
}
