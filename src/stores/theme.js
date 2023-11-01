// src/stores/theme.js

import { writable } from "svelte/store";

// commented out bc of ssr error (window is not defined)
/* const defaultTheme =
	window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light"; */
const defaultTheme = "light";
export const theme = writable(defaultTheme);
