import { Style } from "htmx-router/css";
import { CSSProperties } from "react";

const switchStyle = new Style("switch", `
.this {
	display: flex;
	background-color: hsl(var(--muted));
	border-radius: var(--radius);
	user-select: none;
	padding: 4px;

	cursor: default;
}

.this input[type=radio] {
	display: none;
}

.this > label {
	display: flex;
	align-items: center;

	color: hsl(var(--muted-foreground));

	border-radius: calc(var(--radius) - 4px);
	padding: .375em .75em;
	text-decoration: none;
	user-select: none;

	transition-property: background-color, color;
	transition-duration: .2s;
}

.this > label {
	cursor: pointer;
}

.this label:has(input[type=radio]:checked) {
	background-color: hsl(var(--background));
	color: hsl(var(--foreground));
	cursor: default;
}


`);

export function NamedSwitch(props: {
	name: string,
	options: Array<{ name?: string, value: string, title?: string }>,
	defaultValue?: string,
	style?: CSSProperties
}) {
	const noDefault = props.defaultValue === undefined;

	return <div className={switchStyle.name} style={props.style}>
		{props.options.map((option, i) => (
			<label key={option.value} title={option.title} tabIndex={0}>
				<input
					type="radio"
					name={props.name}
					value={option.value}
					defaultChecked={ noDefault
						? i === 0
						: option.value === props.defaultValue
					}
				/>
				{ option.name || option.value }
			</label>
		))}
	</div>
}