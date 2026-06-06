export interface User {
  id: string;
  name: string;
  email?: string;   // ← backend retorna isso, não name
  role: 'ADMIN' | 'MONITOR';
  status: 'active' | 'inactive';
  avatar: string;
}