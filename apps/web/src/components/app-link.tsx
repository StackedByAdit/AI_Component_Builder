// purpose: in-app anchor that updates the history router without a full reload

import type { MouseEvent, ReactNode } from 'react';
import { navigate } from '../lib/navigation';

interface AppLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
}

export const AppLink = ({ href, className, children, onNavigate }: AppLinkProps) => {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }
    event.preventDefault();
    onNavigate?.();
    navigate(href);
  };

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
};
