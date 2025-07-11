import { CSSProperties, useEffect, useRef } from "react";

import chartTrendline from 'chartjs-plugin-trendline';
import 'chartjs-adapter-date-fns';

import {
	ArcElement,
	BarController,
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	ChartConfiguration,
	Colors,
	Filler,
	Legend,
	LinearScale,
	LineController,
	LineElement,
	PointElement,
	RadialLinearScale,
	Title,
	Tooltip,
	TimeSeriesScale
} from "chart.js";

ChartJS.register(
	Colors,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend,
	ArcElement,
	RadialLinearScale,
	LineController,
	BarController,
	TimeSeriesScale,
	Filler,
	chartTrendline
);


type TrendLine = {
	trendlineLinear?: {
		style?: string | CanvasGradient | CanvasPattern;
		lineStyle?: 'solid' | 'dotted' | 'dashed';
		width?: number;
		projection?: boolean;
		colorMin?: string;
		colorMax?: string;
	};
	trendlineExponential?: {
		style?: string | CanvasGradient | CanvasPattern;
		lineStyle?: 'solid' | 'dotted' | 'dashed';
		width?: number;
		projection?: boolean;
	};
	trendlineLogarithmic?: {
		style?: string | CanvasGradient | CanvasPattern;
		lineStyle?: 'solid' | 'dotted' | 'dashed';
		width?: number;
		projection?: boolean;
	};
	trendlinePolynomial?: {
		style?: string | CanvasGradient | CanvasPattern;
		lineStyle?: 'solid' | 'dotted' | 'dashed';
		width?: number;
		projection?: boolean;
		order?: number;
	};
	trendlinePower?: {
		style?: string | CanvasGradient | CanvasPattern;
		lineStyle?: 'solid' | 'dotted' | 'dashed';
		width?: number;
		projection?: boolean;
	};
}


export function Chart(props: {
	type:    ChartConfiguration["type"],
	data:    ChartConfiguration["data"] & { datasets: Array<TrendLine>},
	options: ChartConfiguration["options"],
	style?: CSSProperties
	hideZeros?: boolean
}) {
	const chartRef = useRef <HTMLCanvasElement> (null);
	const chartInstanceRef = useRef<ChartJS | null>(null);

	useEffect(() => {
		if (!chartRef.current) return;

		const ctx = chartRef.current.getContext("2d");
		if (!ctx) return;

		ctx.fillStyle = "#f8fafc";
		ctx.fillRect(0, 0, chartRef.current.width, chartRef.current.height);

		// Destroy existing chart instance
		if (chartInstanceRef.current) chartInstanceRef.current.destroy();

		if (props.hideZeros) {
			props.options ||= {};
			props.options.plugins ||= {};
			props.options.plugins.tooltip ||= {};
			props.options.plugins.tooltip.filter = function(tooltipItem) {
				return tooltipItem.parsed.x !== null && tooltipItem.parsed.x !== 0;
			}
			props.options.plugins.tooltip.callbacks ||= {};
			props.options.plugins.tooltip.callbacks.title = function(tooltipItems) {
				if (tooltipItems.length === 0) return '';
				return tooltipItems[0].label;
			}
		}

		// Create new chart instance
		chartInstanceRef.current = new ChartJS(ctx, {
			type: props.type,
			data: props.data,
			options: props.options,
		});

		return () => {
			if (!chartInstanceRef.current) return;
			chartInstanceRef.current.destroy();
			chartInstanceRef.current = null;
		};
	}, []);

	return <div style={{ display: "block", backgroundColor: "white", borderRadius: "var(--radius)", flexGrow: 1 }}>
		<canvas ref={chartRef} style={props.style}></canvas>
	</div>;
}