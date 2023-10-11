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

	function smoothScrollDown() {
		const newY = window.scrollY + window.innerHeight;
		window.scrollTo({
			top: newY,
			behavior: "smooth"
		});
	}

	function handleKeydown(event) {
		// Check if the "Enter" key was pressed
		if (event.key === "Enter") {
			smoothScrollDown();
		}
	}
</script>

<div
	id="scrollHint"
	class="scroll"
	on:click="{smoothScrollDown}"
	on:keydown="{handleKeydown}"
	tabindex="0"
	role="button"
	aria-label="Scroll down"
></div>

<style>
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

	.scroll:hover {
		cursor: pointer;
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
