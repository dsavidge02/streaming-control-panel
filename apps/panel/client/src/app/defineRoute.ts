import { createElement, type ReactElement } from "react";
import type { RouteObject } from "react-router";

import { RequireAuth } from "@/app/RequireAuth";

export interface RouteDefinition {
	path: string;
	name: string;
	element: ReactElement;
	gated: boolean;
	toRouteObject(): RouteObject;
}

interface DefineRouteArgs {
	path: string;
	name: string;
	element: ReactElement;
	gated: boolean;
}

export function defineRoute(args: DefineRouteArgs): RouteDefinition {
	return {
		path: args.path,
		name: args.name,
		element: args.element,
		gated: args.gated,
		toRouteObject() {
			return {
				path: args.path,
				element: args.gated
					? createElement(RequireAuth, undefined, args.element)
					: args.element,
			};
		},
	};
}
