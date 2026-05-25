import type { FC, MouseEvent } from 'react';

/**
 * Item del menú lateral. `path` es el destino estándar (NavLink to=...).
 * Si se define `onClick`, se invoca antes de navegar — el handler puede
 * llamar a `event.preventDefault()` para suprimir la navegación
 * (caso: abrir un drawer secundario en desktop sin cambiar la ruta).
 */
export type NavItem = {
  id: string;
  label: string;
  icon: FC;
  path: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};
