import { CSSProperties, ReactNode } from "react";

export function Steps(props: {
	steps: ReactNode[],
	progress?: number,
	style?: CSSProperties
}) {
	const progress = props.progress === undefined ? -1 : props.progress;
	const jsx = [];

	let i = 0;
	for (const step of props.steps) {
		const className = progress > i ? "green no-select" : "muted no-select";
		jsx.push(<div className={className} style={{
			display: "flex", alignItems: "center", justifyContent: "center",
			height: "30px", width: "30px",
			borderRadius: "100%"
		}}>{++i}</div>)
		jsx.push(step);
	}

	return <div style={{
		display: "grid",
		gridTemplateColumns: "auto 1fr",
		alignItems: "center",
		gap: "10px",
		...props.style
	}}>{jsx}</div>;
}