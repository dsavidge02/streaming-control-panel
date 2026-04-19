import { createElement } from "react";

import { defineRoute } from "@/app/defineRoute";
import { HomePlaceholder } from "@/views/HomePlaceholder";
import { Landing } from "@/views/Landing";
import { SettingsPlaceholder } from "@/views/SettingsPlaceholder";

export const routes = [
	defineRoute({
		path: "/",
		name: "landing",
		element: createElement(Landing),
		gated: false,
	}),
	defineRoute({
		path: "/home",
		name: "home",
		element: createElement(HomePlaceholder),
		gated: true,
	}),
	defineRoute({
		path: "/settings",
		name: "settings",
		element: createElement(SettingsPlaceholder),
		gated: true,
	}),
	defineRoute({
		path: "*",
		name: "unknown",
		element: createElement(HomePlaceholder),
		gated: true,
	}),
];
