<script>
	import "$styles/app.css";
	import Header from "$components/Header.svelte";
	import { theme } from "$stores/theme.js";

	function updateTheme(node) {
		const unsubscribe = theme.subscribe((currentTheme) => {
			node.dataset.theme = currentTheme;
		});

		return {
			destroy() {
				unsubscribe();
			}
		};
	}
</script>

<!-- <Header /> -->
<main id="content" use:updateTheme>
	<slot />
</main>
