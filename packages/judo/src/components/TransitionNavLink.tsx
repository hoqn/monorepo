import { NavLink, type NavLinkProps } from 'react-router-dom';
import { useViewTransitionClick } from '../lib/use-view-transition-click';

export default function TransitionNavLink({ to, onClick, ...rest }: NavLinkProps) {
  const handleClick = useViewTransitionClick(to, onClick);
  return <NavLink to={to} onClick={handleClick} {...rest} />;
}
