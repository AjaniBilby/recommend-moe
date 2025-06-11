import { Style } from "htmx-router/css";


const runningSpinner = new Style("running-spinner", `
.this {
	display: inline-flex;
	align-items: center;
	justify-content: center;

	font-size: 1rem;

	padding: .125em;
	border-radius: 50%;

	border: .35em solid transparent;

	background-origin: border-box;
	background-clip: padding-box, border-box;

	--angle: 0deg;
	background-image:
		linear-gradient(to right, hsl(var(--background)), hsl(var(--background))),
		conic-gradient(from var(--angle),
			hsl(var(--green)) 0% 25%,
			hsl(var(--border)) 25% 100%
		);
	;

	animation: rotateAngle 1s linear infinite;
}

.this > div {
	width: 1em;
	height: 1em;
	background-color: hsl(var(--green));
	border-radius: 100%;
}
`);

	export function RunningSpinner(props: JSX.IntrinsicElements["div"]) {
		const { className, ...rest } = props;

		return <div
			className={className ? `${className} ${runningSpinner.name}` : runningSpinner.name}
			{...rest}
		>
			<div></div>
		</div>;
	}