import type { Role } from './types.ts';

export interface RoleInfo { name: string; token: string; what: string }

/** The jobs a part can do. Order: the order they are listed in (input, process, ...), not a sequence of steps. */
export const ROLES: Record<Role, RoleInfo> = {
  input: { name: 'Input', token: '--role-input', what: 'Takes something in from you or the world: a touch, a key, light, sound.' },
  process: { name: 'Process', token: '--role-process', what: 'Works on the information: follows the instructions of every app.' },
  memory: { name: 'Memory', token: '--role-memory', what: 'Holds what is open right now, fast. Forgets it when the power goes off.' },
  storage: { name: 'Storage', token: '--role-storage', what: 'Keeps files and apps when the power is off.' },
  output: { name: 'Output', token: '--role-output', what: 'Gives something back to you: a picture, a sound, a buzz.' },
  communicate: { name: 'Communicate', token: '--role-communicate', what: 'Talks to other devices: Wi-Fi, mobile network, cables.' },
  power: { name: 'Connect and power', token: '--role-power', what: 'Holds everything together, powers it and keeps it cool.' },
};
export const ROLE_ORDER: Role[] = ['input', 'process', 'memory', 'storage', 'output', 'communicate', 'power'];
