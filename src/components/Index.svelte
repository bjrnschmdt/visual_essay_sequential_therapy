<script>
	import { getContext, onMount } from "svelte";
	import Board from "./../simulation/Board";
	import * as d3 from "d3";
	import { color } from "d3-color";
	/* import parsed from "./../data/md.json"; */
	import { Poline, positionFunctions } from "poline";
	import { formatRgb } from "culori";
	import { detectBreakpoints, getBreakpointValue } from "$utils/breakpoints";
	import ScrollHint from "./helpers/ScrollHint.svelte";

	export let content;
	export let showGraphics;

	let canvas;
	let ctx;

	let worker;

	let cache = {};

	let innerWidth,
		innerHeight,
		scrollX,
		scrollY = 0,
		outerHeight;
	//let board;
	let currentBreakpoint;
	let dampFactor;
	let easeFactor = 16;
	let genCurrent;
	let genCurrentDamped;
	let genCurrentDelta;
	let yCurrent;
	let yRealPrevious;
	let yRealDelta;
	let inProgress = true;
	let poline;
	let rgbColors = [];
	let d3Colors = [];
	let boundingBoxes;
	let bbWrapper;

	// Define the number of generations to generate at a time
	const numGensPerBatch = 1000;

	// Define the starting generation number
	let startGen = -30;

	/* const maxScrollHeight = document.body.scrollHeight; */
	//let maxScrollPos = numGensPerBatch * dampFactor;

	onMount(() => {
		// detect breakpoints
		detectBreakpoints();
		currentBreakpoint = getBreakpointValue();

		// Get the canvas context
		ctx = canvas.getContext("2d");

		// Set the canvas dimensions
		canvas.width = currentBreakpoint.width;
		canvas.height = innerHeight;
		ctx.translate(0, -scrollY);

		// Override the CSS styles to avoid stretching
		canvas.style.width = "auto";
		canvas.style.height = "auto";

		if (!showGraphics) return; // Don't run the simulation if the graphics are hidden

		dampFactor = currentBreakpoint.value;
		/* console.log("key: ", currentBreakpoint.key);
		console.log("dampFactor: ", dampFactor); */

		boundingBoxes = getBoundingBoxes();

		poline = new Poline({
			numPoints: boundingBoxes.length - 2,
			/* positionFunction: positionFunctions.exponentialPosition, */
			anchorColors: [
				[0, 1.0, 1.0],
				[0, 1.0, 0.5]
				//... more colors
			]
		});

		// Convert Poline colors to RGB format
		rgbColors = [...poline.colors].map((c) =>
			formatRgb({ mode: "hsl", h: c[0], s: c[1], l: c[2], alpha: 0.35 })
		);

		// Convert rgbColors to d3.color format
		d3Colors = [...rgbColors].map((c) => color(c));

		d3.selectAll(".info")
			.style("color", (d, i) => d3Colors[i + 1].formatRgb())
			.style("border-color", (d, i) => d3Colors[i + 1].formatRgb())
			.style("background", (d, i) => {
				d3Colors[i + 1].opacity = 0.1;
				return d3Colors[i + 1].formatRgb();
			});

		yCurrent = scrollY;
		yRealPrevious = scrollY;
		yRealDelta = 0;

		genCurrent = scrollY / dampFactor;
		genCurrentDamped = -30;
		genCurrentDelta = genCurrent - genCurrentDamped;

		bbWrapper = d3.select(".wrapper").node().getBoundingClientRect();

		getSimulation(currentBreakpoint);

		animate();

		d3.select(window).on("scroll", function () {
			// Update polygons on scroll
			yCurrent = scrollY;
			if (!inProgress) {
				inProgress = true;
				animate();
			}

			// If the user has scrolled to the bottom of the page, generate the next batch of generations
			/* if (y + 100 >= maxScrollPos) {
  			startGen += numGensPerBatch;
			maxScrollPos += numGensPerBatch * dampFactor; 
  			board.generate(startGen, numGensPerBatch);
			} */
		});

		d3.select(window).on("beforeunload", function () {
			// Close the worker thread
			worker.terminate();
		});

		d3.select(window).on("resize", debounce(handleResize, 500));
	});

	/**
	 * Animates the board by computing the bounding box of the visible region,
	 * updating the previous and current Y values, and displaying the board with
	 * the updated Y values. If the difference between the previous and current Y
	 * values is less than 0.1, the animation stops.
	 */
	function animate() {
		// Compute the difference between the current and previous Y values; used to dampen the scrolling
		genCurrent = scrollY / dampFactor;
		genCurrentDelta = genCurrent - genCurrentDamped;
		genCurrentDamped += genCurrentDelta / easeFactor;

		// Compute the difference between the current and previous real Y values; used to translate the canvas
		yRealDelta = yCurrent - yRealPrevious;
		yRealPrevious += yRealDelta;

		// Display the board with the updated Y values
		cache[currentBreakpoint.key].display(
			ctx,
			yCurrent,
			innerHeight,
			genCurrent,
			genCurrentDamped
		);

		if (Math.abs(genCurrentDelta) < 0.1) {
			inProgress = false;
			return;
		}

		// Translate the canvas to adjust for the scrolling
		ctx.translate(0, -yRealDelta);

		// Request the next animation frame
		window.requestAnimationFrame(animate);
	}

	function handleResize() {
		/* console.log("resize"); */
		detectBreakpoints();
		/* console.log("breakpoint Value: ", getBreakpointValue()); */
		if (currentBreakpoint !== getBreakpointValue()) {
			currentBreakpoint = getBreakpointValue();
			dampFactor = currentBreakpoint.value;
			/* console.log("dampFactor: ", dampFactor); */
			updateCanvasSize(currentBreakpoint.width, innerHeight);
			genCurrentDamped = -30;
			ctx.translate(0, -scrollY);
			getSimulation(currentBreakpoint);
			animate();
		}
	}

	function updateCanvasSize(width, height) {
		canvas.width = width;
		canvas.height = height;
	}

	function getBoundingBoxes() {
		const boundingBoxes = [];
		const parentElement = document.querySelector(".wrapper");

		[...parentElement.children].forEach((childElement) => {
			const boundingBox = {
				top: childElement.offsetTop,
				height: childElement.offsetHeight
			};
			boundingBoxes.push(boundingBox);
		});
		return boundingBoxes;
	}

	function nthTerm(n) {
		let value = 0.5 * Math.pow(1.5, n - 1);
		return value.toFixed(1);
	}

	function interpolate(x, y1 = 0.5, y2 = 40, x1 = 1, x2 = 24, p = 2) {
		let value = y1 + (y2 - y1) * Math.pow((x - x1) / (x2 - x1), p);
		value = value * 2; // correcting the concentration level
		return value.toFixed(1);
	}

	function debounce(func, delay) {
		let timer;
		return function (...args) {
			clearTimeout(timer);
			timer = setTimeout(() => {
				func.apply(this, args);
			}, delay);
		};
	}

	function getSimulation(parameters) {
		const cacheKey = parameters.key;

		// Check if the result is in cache
		if (cache[cacheKey]) {
			/* console.log("cache hit"); */
			return cache[cacheKey];
		}

		// Otherwise, compute and store in cache
		/* console.log("cache miss, create new board"); */
		cache[cacheKey] = new Board(
			parameters.width,
			bbWrapper.height,
			/* 600, */
			ctx,
			scrollY,
			innerHeight,
			dampFactor,
			boundingBoxes,
			rgbColors
		);

		/* console.log("generate new board"); */
		cache[cacheKey].generate(startGen, numGensPerBatch);
	}
</script>

<canvas bind:this="{canvas}"></canvas>
<div class="wrapper">
	<div class="h1-wrap">
		<h1>{content.h1}</h1>
		<h2>Ein Visual Essay des Kiel Science Communication Network</h2>
		<ScrollHint />
	</div>

	{#each content.text as paragraph, index}
		<div class="card-wrap">
			{#if showGraphics}
				<p class="info">
					P.aeruginosa | Tag {(index + 1).toString().padStart(2, "0")} | Antibiotikakonzentration
					{interpolate(index + 1)}x
				</p>
			{/if}
			<p class="card">{paragraph.value}</p>
		</div>
		<!-- <hr/> -->
	{/each}
</div>

<svelte:window
	bind:scrollX="{scrollX}"
	bind:scrollY="{scrollY}"
	bind:innerWidth="{innerWidth}"
	bind:innerHeight="{innerHeight}"
	bind:outerHeight="{outerHeight}"
/>

<style>
	.h1-wrap {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		z-index: 1;
		position: relative;
		/* max-width: calc(100% - 20px); */
		height: 100vh;
	}

	h1 {
		font-family: "Golos Text";
		font-weight: 700;
		line-height: 1;
		font-size: clamp(var(--18px), 8vw, var(--56px));
		z-index: 99;
		color: white;
		width: 100%;
		max-width: 560px;
		text-align: left;
	}

	h2 {
		font-family: "Golos Text";
		font-weight: 400;
		line-height: 1;
		font-size: clamp(var(--16px), 4vw, var(--18px));
		z-index: 99;
		color: white;
		width: 100%;
		max-width: 560px;
		text-align: left;
	}

	p {
		font-family: "Golos Text";
		line-height: 1.6;
		width: 100%;
		max-width: 560px;
	}

	.wrapper {
		position: absolute;
		width: 100%;
		padding: 0 16px;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
		background-color: rgb(25, 25, 25);
		overflow: hidden;
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: -1;
	}

	.card-wrap {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
		z-index: 1;
		position: relative;
		max-width: 560px;
		padding: 0 0 64px;
		margin: auto;
	}

	.card {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: saturate(180%) blur(10px);
		-webkit-backdrop-filter: saturate(180%) blur(10px);
		padding: 18px 24px;
		margin-top: 20px;
		color: black;
		width: 100%;
		max-width: 560px;
		border-radius: 4px;
		box-shadow: 0 0 20px -10px black;
	}

	.info {
		text-align: center;
		max-width: 560px;
		background: rgba(255, 0, 0, 0.1);
		backdrop-filter: saturate(70%) blur(10px);
		-webkit-backdrop-filter: saturate(70%) blur(10px);
		font-family: "Share Tech Mono", monospace;
		font-size: small;
		padding: 2px 24px 1px;
		color: rgba(255, 0, 0, 0.35);
		margin-top: 0;
		margin-bottom: 36px;
		border-style: solid;
		border-width: 1px;
		border-color: rgba(255, 0, 0, 0.35);
		border-radius: 4px;
		width: 100%;
	}

	@media (max-width: 480px) {
		h1,
		h2,
		p {
			padding: 0 20px;
		}

		.card,
		.info {
			padding: 10px 20px;
		}
	}
</style>
