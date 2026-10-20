import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function BigButton(
  props: ButtonHTMLAttributes<HTMLButtonElement> & {
    icon?: IconName;
    variant?: Variant;
    children?: ReactNode;
    testId?: string;
  },
) {
  const { icon, variant = 'secondary', children, testId, className, ...rest } = props;
  return (
    <button
      type="button"
      data-testid={testId}
      className={`btn btn-${variant}${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {children !== undefined && <span className="btn-label">{children}</span>}
    </button>
  );
}

/** Square icon-only button; label is the accessible name. */
export function IconButton(
  props: ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: IconName;
    label: string;
    testId?: string;
  },
) {
  const { icon, label, testId, className, ...rest } = props;
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={label}
      title={label}
      className={`icon-btn${className ? ` ${className}` : ''}`}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  );
}
