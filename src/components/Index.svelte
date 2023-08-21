<script>
	import { getContext, onMount } from "svelte";
	import Board from "./../simulation/Board";
	import * as d3 from "d3";
	import parsed from "./../data/md.json";
	

	let canvas;
 	let ctx;

	let worker;

	let innerWidth, innerHeight, scrollX, scrollY = 0, outerHeight;
	let board;
	let dampFactor = 8;
	let easeFactor = 16;
	let genCurrent = 1;
	let genCurrentDamped = 1;
	let genCurrentDelta = 0;
	let yCurrent = 1;
	let yRealPrevious = 0;
	let yRealDelta = 0;
	let inProgress = true;

	// Define the number of generations to generate at a time
	const numGensPerBatch = 800;

	// Define the starting generation number
	let startGen = 1;

	/* const maxScrollHeight = document.body.scrollHeight; */
	let maxScrollPos = numGensPerBatch * dampFactor; 

	onMount(() => {

		yCurrent = scrollY;
		yRealPrevious = scrollY;
		yRealDelta = scrollY;

		// Get the canvas context
		ctx = canvas.getContext("2d");

		// Set the canvas dimensions
    	canvas.width = innerWidth;
    	canvas.height = innerHeight;
		ctx.translate(0, -scrollY);

		let bbWrapper = d3.select(".wrapper").node().getBoundingClientRect();
		console.log("wrapper height: ", bbWrapper.height);
		board = new Board(innerWidth, bbWrapper.height, 600, ctx, scrollY, innerHeight);
		console.log("scrollY: ", scrollY);
		console.log("innerHeight: ", innerHeight);
		console.log("innerWidth: ", innerWidth);	
		board.generate(startGen, numGensPerBatch);

		animate();
			
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
			board.display(ctx, yCurrent, innerHeight, genCurrent, genCurrentDamped);

			if (Math.abs(genCurrentDelta) < 0.1) {
				inProgress = false;
				return;
			}

			// Translate the canvas to adjust for the scrolling
			ctx.translate(0, -yRealDelta);

			// Request the next animation frame
			window.requestAnimationFrame(animate);
		}
		
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
	});

	function updateCanvasSize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  	}


</script>

<canvas bind:this={canvas}></canvas>
<div class="wrapper">
	
	<div class="card-wrap">
		<h1>{parsed.h1}</h1>
		<h2>Ein Visual Essay des Kiel Science Communication Network</h2>
	</div>

	{#each parsed.fear_frame as paragraph}
		<div class="card-wrap">
			<p class="card">{paragraph.value}</p>
		</div>
	{/each}
</div>


<svelte:window bind:scrollX={scrollX} bind:scrollY={scrollY} bind:innerWidth={innerWidth} bind:innerHeight={innerHeight} bind:outerHeight={outerHeight} />


<style>
	h1 {
		font-family: "Golos Text";
		font-weight: 700;
		line-height: 1;
		font-size: var(--56px);
		z-index: 99;
		color: white;
		width: 100%;
		text-align: left;
	}

	h2 {
		font-family: "Golos Text";
		font-weight: 400;
		line-height: 1;
		font-size: var(--18px);
		z-index: 99;
		color: white;
		width: 100%;
		text-align: left;
	}

	p {
		font-family: "Golos Text";
		line-height: 1.6;
	}

	.wrapper {
		position: absolute;
		width: 100%;
	}

	canvas {
  		position: fixed;
  		top: 0;
  		left: 0;
  		z-index: -1;
  		width: 100%;
  		height: 100%;
	}

	.card-wrap {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: flex-start;
		z-index: 1;
		position: relative;
		width: 560px;
		max-width: calc(100% - 20px);
		margin: 30vh auto 25vh;
	}

	.card {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: saturate(180%) blur(10px);
		-webkit-backdrop-filter: saturate(180%) blur(10px);
		padding: 18px 24px;
		color: black;
		max-width: 560px;
		border-radius: 4px;
		box-shadow: 0 0 20px -10px black;
	}
</style>
