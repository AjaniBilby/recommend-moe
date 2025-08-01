import { CSSProperties, ReactNode } from "react";

import { RunningSpinner } from "~/component/status.tsx";

type Preload = "mouseover" | "mousedown" | "none" | "always";
export function Link(props: { preload?: Preload } & JSX.IntrinsicElements["a"]) {
	const { style, ...restProps } = props;

	return <a
		style={{ color: "unset", textDecoration: "inherit", ...style }}
		hx-target="body"
		hx-swap="innerHTML transition:true"
		{...restProps}
	></a>;
}


export function LazyLoad(props: {
	href: string,
	style?: CSSProperties,
	className?: string,
	children?: ReactNode
}) {
	const { href, children, ...rest } = props;
	return <div
		hx-trigger="intersect once"
		{...rest}
		hx-get={href}
		hx-target="this"
		hx-swap="outerHTML transition:true"
	>{children === undefined ? <RunningSpinner /> : children}</div>
}

export function Open(props: { href: string, newWindow?: boolean } & JSX.IntrinsicElements["div"]) {
	const { href, style, ...restProps } = props;

	return <div
		hx-get={href}
		hx-target="body"
		hx-swap="beforeend"
		hx-push-url="false"
		style={{ color: "unset", textDecoration: "inherit", cursor: "pointer", ...style }}
		tabIndex={restProps.tabIndex || 0}
		{...restProps}
	></div>;
}