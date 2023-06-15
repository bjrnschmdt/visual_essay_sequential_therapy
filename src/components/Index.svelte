<script>
	import { getContext, onMount } from "svelte";
	import Board from "./../simulation/Board";
	import * as d3 from "d3";
	import archieml from "archieml";
	//import text from "./../data/text.txt?raw";
	import parsed from "./../data/md.json";

	//const parsed = archieml.load(text);

	let w, h, y;
	let board;
	let cells = [];
	let dampFactor = 8;
	let previousY = 0;
	let currentY = 0;
	let dY = 0;
	let inProgress = false;

	onMount(() => {
		let height = d3.select(".wrapper").node().getBoundingClientRect();
		board = new Board(w, 3000, 500);
		board.generate();
		cells = board.cells;
		console.log(board);

		function animate() {
			dY = currentY - previousY;
			previousY += dY / 16;

			svg
				.selectAll("path")
				.data(board.cells, function (d) {
					// Callback is used to match cells with data
					return d.getIndex();
				})
				.filter(function (d) {
					return d.isAlive(Math.round(previousY / dampFactor));
				})
				//.transition()
				//.duration(100)
				.attr("fill", function (d) {
					return d.getColor(
						d.getCurrentStateIndex(Math.round(previousY / dampFactor))
					);
				})
				.attr("stroke", function (d) {
					return d3
						.color(
							d.getColor(
								d.getCurrentStateIndex(Math.round(previousY / dampFactor))
							)
						)
						.brighter()
						.formatRgb();
				});

			if (Math.abs(dY) < 0.1) {
				inProgress = false;
				return;
			}
			window.requestAnimationFrame(animate);
		}

		//Create SVG element
		let svg = d3
			.select("main")
			.append("svg")
			.attr("width", w)
			.attr("height", height.height)
			.attr("class", "sim");

		//Create polygons
		svg
			.selectAll("path")
			.data(board.cells, function (d) {
				return d.getIndex();
			})
			.enter()
			.append("path")
			.attr("d", function (d, i) {
				return board.voronoi.renderCell(i);
			})
			.attr("stroke", function (d) {
				return d3.color(d.getColor(0)).brighter().formatRgb();
			})
			.attr("stroke-width", "1px")
			.attr("fill", function (d) {
				return d3.color(d.getColor(0));
			});

		// Update polygons on scroll
		d3.select(window).on("scroll", function () {
			currentY = y;
			if (!inProgress) {
				inProgress = true;
				animate();
			}
		});
	});
</script>

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

<svelte:window bind:scrollY={y} bind:innerWidth={w} bind:innerHeight={h} />

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
