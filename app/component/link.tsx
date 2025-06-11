import { CSSProperties, ReactNode } from "react";

import { RunningSpinner } from "~/component/status";

type Preload = "mouseover" | "mousedown" | "none" | "always";
export function Link(props: { preload?: Preload, newWindow?: boolean | WindowConfig } & JSX.IntrinsicElements["a"]) {
	const { style, newWindow, ...restProps } = props;

	return <a
		style={{ color: "unset", textDecoration: "inherit", ...style }}
		hx-target="body"
		hx-swap="innerHTML"
		data-new-window={newWindow === true ? true
			: typeof newWindow === "object" ? JSON.stringify(newWindow)
			: undefined}
		hx-boost={newWindow ? "false" : undefined}
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
		hx-swap="outerHTML"
	>{children === undefined ? <RunningSpinner /> : children}</div>
}