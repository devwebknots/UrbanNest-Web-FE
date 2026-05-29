/**
 * src/components/ui/index.js
 * Barrel export for all shared UI components.
 * Import from here, never from individual files directly.
 *
 * Usage:
 *   import { Button, Input, CustomDropdown } from '../components/ui';
 */

export { default as Button }              from './Button';
export { default as Input }               from './Input';
export { default as Select }              from './Select';
export { default as Divider }             from './Divider';
export { default as TestimonialCarousel } from './TestimonialCarousel';
export { default as CustomDropdown }      from './CustomDropdown';

// ⏳ Pending:
// export { default as SvgIcon } from './SvgIcon';