"use client";

/**
 * SafeLink - A performance-optimized Next.js Link wrapper
 * 
 * Addresses the "preload unused resources" warning by disabling
 * automatic prefetching. Use this for non-critical navigation links
 * like footer links, sidebar links, or any links that users rarely click.
 * 
 * For critical above-the-fold navigation, you can set `prefetch={true}`
 * to explicitly enable prefetching.
 * 
 * @see https://nextjs.org/docs/app/api-reference/components/link#prefetch
 */

import Link from "next/link";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

type SafeLinkProps = ComponentPropsWithoutRef<typeof Link>;

const SafeLink = forwardRef<HTMLAnchorElement, SafeLinkProps>(
    ({ prefetch = false, ...props }, ref) => {
        return <Link ref={ref} prefetch={prefetch} {...props} />;
    }
);

SafeLink.displayName = "SafeLink";

export { SafeLink };
export default SafeLink;
