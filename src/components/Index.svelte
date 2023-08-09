<script>
	import { getContext, onMount } from "svelte";
	import Board from "./../simulation/Board";
	import MyWorker from "./../simulation/my-worker.worker.js?worker";
	import * as d3 from "d3";
	import parsed from "./../data/md.json";
	

	let canvas;
 	let ctx;

	let worker;
	let cells = [];

	let innerWidth, innerHeight, scrollX, scrollY = 0, outerHeight;
	let board;
	let dampFactor = 8;
	let previousY = 1;
	let currentY = 1;
	let previousYReal = 0;
	let dY = 0;
	let dYReal = 0;
	let inProgress = false;

	// Define the number of generations to generate at a time
	const numGensPerBatch = 500;

	// Define the starting generation number
	let startGen = 1;

	/* const maxScrollHeight = document.body.scrollHeight; */
	let maxScrollPos = numGensPerBatch * dampFactor; 

	onMount(() => {
		worker = new MyWorker();
  		worker.onmessage = (event) => {
    		cells = event.data;
			console.log(cells);
  		};

		// Get the canvas context
		ctx = canvas.getContext("2d");

		// Set the canvas dimensions
    	canvas.width = innerWidth;
    	canvas.height = innerHeight;

		let bbWrapper = d3.select(".wrapper").node().getBoundingClientRect();
		console.log(bbWrapper.height);
		board = new Board(innerWidth, 3000, 500);
		board.generate(startGen, numGensPerBatch);
		board.display(ctx, scrollY, innerHeight, previousY, dampFactor);		

		function animate() {
			// Compute the bounding box of the visible region
			const bounds = [
      			0,
      			scrollY,
      			innerWidth,
      			scrollY + innerHeight
    		];

			dY = currentY - previousY;
			previousY += dY / 16;

			dYReal = scrollY - previousYReal;
			previousYReal += dYReal;
				
			board.display(ctx, scrollY, innerHeight, previousY, dampFactor);

			if (Math.abs(dY) < 0.1) {
				inProgress = false;
				/* let visible = board.getVisible( scrollY, innerHeight);
				console.log(visible.length , visible.filter(d => d.state.length > 0).length); */
				return;
			}
			ctx.translate(0, -dYReal);
			window.requestAnimationFrame(animate);
		}
		
		d3.select(window).on("scroll", function () {
			// Update polygons on scroll
			currentY = scrollY;
			if (!inProgress) {
				inProgress = true;
				animate();
			}
			//console.log("scrolling: " + y);

			// If the user has scrolled to the bottom of the page, generate the next batch of generations
			/* if (y + 100 >= maxScrollPos) {
  			startGen += numGensPerBatch;
			maxScrollPos += numGensPerBatch * dampFactor; 
  			board.generate(startGen, numGensPerBatch);
			} */
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

<svelte:window bind:scrollX={scrollX} bind:scrollY={scrollY} bind:innerWidth={innerWidth} bind:innerHeight={innerHeight} bind:outerHeight={outerHeight}/>

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
