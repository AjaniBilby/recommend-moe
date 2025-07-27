import type { ClientIslandManifest } from "htmx-router";

import { ThemeSwitcher } from "~/component/client/theme-switcher.tsx";
import { Chart } from "~/component/client/chart.tsx";

const Client = {
	Chart,
	ThemeSwitcher
};

export default Client as ClientIslandManifest<typeof Client>;