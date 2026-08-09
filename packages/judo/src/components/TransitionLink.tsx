import { Link, type LinkProps } from 'react-router-dom';
import { useViewTransitionClick } from '../lib/use-view-transition-click';

export default function TransitionLink({ to, onClick, ...rest }: LinkProps) {
  const handleClick = useViewTransitionClick(to, onClick);
  return <Link to={to} onClick={handleClick} {...rest} />;
}
