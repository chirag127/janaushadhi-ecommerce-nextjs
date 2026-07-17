"use client";

import * as React from "react";

/**
 * Minimal Slot implementation (Radix-free): merges its props onto a single
 * child element, enabling the `asChild` pattern.
 */
export const Slot = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }
>(({ children, ...props }, ref) => {
  if (React.isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>;
    const childProps = child.props;
    return React.cloneElement(child, {
      ...props,
      ...childProps,
      className: [
        (props as { className?: string }).className,
        (childProps as { className?: string }).className,
      ]
        .filter(Boolean)
        .join(" "),
      ref,
    } as Record<string, unknown>);
  }
  if (React.Children.count(children) > 1) {
    React.Children.only(null);
  }
  return null;
});
Slot.displayName = "Slot";
