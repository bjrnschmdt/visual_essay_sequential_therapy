<script>
	import { setContext } from "svelte";
	import { browser } from "$app/environment";
	import Meta from "$components/Meta.svelte";
	import Index from "$components/Index.svelte";
	import copy from "$data/copy.json";
	import version from "$utils/version.js";
	import parsed from "$data/md.json";

	export let data;

	version();

	/* 	const preloadFont = [
		"https://pudding.cool/assets/fonts/tiempos/TiemposTextWeb-Regular.woff2",
		"https://pudding.cool/assets/fonts/tiempos/TiemposTextWeb-Bold.woff2",
		"https://pudding.cool/assets/fonts/national/National2Web-Regular.woff2",
		"https://pudding.cool/assets/fonts/national/National2Web-Bold.woff2"
	]; */
	const { h1, fear_frame: text } = parsed;
	const content = { h1, text };
	const { title, description, url, keywords } = copy;
	const showGraphics = true;
	setContext("copy", copy);
	setContext("data", data.data);
</script>

<Meta
	title="{title}"
	description="{description}"
	url="{url}"
	keywords="{keywords}"
/>
<Index content="{content}" showGraphics="{showGraphics}" />
