<script>
	import { setContext } from "svelte";
	import { browser } from "$app/environment";
	import Meta from "$components/Meta.svelte";
	import Index from "$components/Index.svelte";
	import copy from "$data/copy.json";
	import version from "$utils/version.js";
	import parsed from "$data/md.json";
	import { theme } from "$stores/theme.js";

	export let data;

	version();

	/* 	const preloadFont = [
		"https://pudding.cool/assets/fonts/tiempos/TiemposTextWeb-Regular.woff2",
		"https://pudding.cool/assets/fonts/tiempos/TiemposTextWeb-Bold.woff2",
		"https://pudding.cool/assets/fonts/national/National2Web-Regular.woff2",
		"https://pudding.cool/assets/fonts/national/National2Web-Bold.woff2"
	]; */
	const { h1_en_alt: h1, h2_en: h2, jane_trust: text } = parsed;
	const content = { h1, h2, text };
	const { title, description, url, keywords } = copy;
	const showGraphics = false;
	const showText = false;
	const themeValue = "dark";
	const darkmode = false;

	setContext("copy", copy);
	setContext("data", data.data);
	/* theme.set("light"); */
</script>

<Meta
	title="{title}"
	description="{description}"
	url="{url}"
	keywords="{keywords}"
/>
<Index
	content="{content}"
	showGraphics="{showGraphics}"
	showText="{showText}"
	themeValue="{themeValue}"
	darkmode="{darkmode}"
/>
