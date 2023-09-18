<script>
	import { onMount } from "svelte";

	onMount(() => {
		const handleScroll = () => {
			if (window.scrollY > 100) {
				document.getElementById("scrollHint").style.opacity = "0";
			} else {
				document.getElementById("scrollHint").style.opacity = "1";
			}
		};

		window.addEventListener("scroll", handleScroll);

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	});
</script>

<!-- <div id="scrollHint" on:click="{() => window.scrollBy(0, window.innerHeight)}">
	⬇️
</div> -->

<div id="scrollHint" class="scroll"></div>

<style>
	/* #scrollHint {
		position: fixed;
		bottom: 10%;
		left: 50%;
		transform: translateX(-50%);
		cursor: pointer;
		animation: bounce 1s infinite;
		opacity: 1;
		transition: opacity 0.5s ease-out;
	}

	@keyframes bounce {
		0%,
		20%,
		50%,
		80%,
		100% {
			transform: translateY(0);
		}
		40% {
			transform: translateY(-10px);
		}
		60% {
			transform: translateY(-5px);
		}
	} */

	.scroll {
		transition: opacity 0.5s ease-out;
		margin-top: 32px;
		width: 30px;
		height: 30px;
		border: 1.5px solid #666;
		border-radius: 50%;
		position: relative;
		animation: down 1.5s infinite;
		-webkit-animation: down 1.5s infinite;
	}

	.scroll::before {
		content: "";
		position: absolute;
		top: 7.5px;
		left: 9px;
		width: 9px;
		height: 9px;
		border-left: 1.5px solid #666;
		border-bottom: 1.5px solid #666;
		transform: rotate(-45deg);
	}

	@keyframes down {
		0% {
			transform: translate(0);
		}
		20% {
			transform: translateY(7.5px);
		}
		40% {
			transform: translate(0);
		}
	}

	@-webkit-keyframes down {
		0% {
			transform: translate(0);
		}
		20% {
			transform: translateY(7.5px);
		}
		40% {
			transform: translate(0);
		}
	}
</style>
