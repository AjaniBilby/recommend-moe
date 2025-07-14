import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons/index.js";
import { CSSProperties } from "react";

export function IconButton(props: {
	type?: "button" | "submit" | "reset"
	label?: string,
	className?: string,
	style?: CSSProperties,
	icon: IconDefinition,
	iconSize?: CSSProperties['height']
} & JSX.IntrinsicElements["button"]) {
	const { type, className, label, style, icon, iconSize, ...rest } = props;

	if (label) return <button type={type || "button"} className={className || "secondary"} style={{
		height: "35px",
		display: "flex", alignItems: "center", gap: "8px",
		padding: "0 10px 0 8px",
		...style
	}} {...rest}>
		<FontAwesomeIcon icon={icon} style={{ height: iconSize || "16px" }} />
		{label}
	</button>

	return <button type={type || "button"} className={className || "secondary"} style={{
		display: "flex", alignItems: "center", justifyContent: "center",
		height: "35px", width: "35px",
		padding: "0",
		...style
	}} {...rest}>
		<FontAwesomeIcon icon={icon} style={{ height: iconSize || "16px" }} />
	</button>
}