<script>
	import { getContext, onMount } from "svelte";
	import Board from "./../simulation/Board";
	import * as d3 from "d3";
	import { octave, perlin2 } from "./../simulation/perlinNoise"
	import archieml from "archieml";
	import text from "./../data/text.txt?raw"

	const parsed = archieml.load(text);
	const str = JSON.stringify(parsed);

	let w, h, y;
	let noiseScale = 0.001;
	let octaves = 5;
	let board;
	let cells = [];
 	let noise = octave(perlin2, octaves);

	onMount(() => {
		let height = d3.select(".wrapper").node().getBoundingClientRect();
		console.log(height.height);
		board = new Board(w, h, 500);
		board.generate();
		cells = board.cells;
		//console.log(board);

		let scaleLinear = d3.scaleLinear()
			.domain([-1, 1])
			.range([0, 100]);

		const baseColor = (x, y, noiseScale) => {
			let perlin = noise(x * noiseScale, y * noiseScale);
			let p = Math.floor(scaleLinear(perlin));
			return d3.rgb(p, p, p);
		}

		//Create SVG element
		let svg = d3.select("main")
			.append("svg")
			.attr("width", w)
			.attr("height", height.height)
			.attr("class", "sim");

		//Create polygons
		svg.selectAll("path")
			.data(board.points)
			.enter()
			.append("path")
			.attr("d", function (d, i) {
        		return board.voronoi.renderCell(i);
    		})
   	 		.attr("stroke", function(d) {
				let color = baseColor(d[0], d[1], noiseScale);
				return color.brighter().formatRgb();
			})
    		.attr("stroke-width", "1px")
			.attr("fill", function(d) {
				let color = baseColor(d[0], d[1], noiseScale);
				return color.formatRgb();
			})


		d3.select(window)
			.on("scroll", function() {
				let color;
				svg.selectAll("path")
				.data(board.cells)
				//.transition()
				//.duration(100)
				.attr("fill", function(d, i) {
					let [xPos, yPos] = d.getPos();
					let fromColor = baseColor(xPos, yPos, noiseScale);
					let toColor = d3.rgb("dimgrey");
					let interpolator = d3.interpolateRgb(fromColor, toColor);
					let ease = d3.easeExpInOut(d.getCurrent(Math.round(y / 8))/1);
					return interpolator(ease); 
				})
				.attr("stroke", function(d, i) {
					let [xPos, yPos] = d.getPos();
					let fromColor = baseColor(xPos, yPos, noiseScale).brighter(0.5);
					let toColor = d3.rgb("dimgrey").brighter(0.5);
					let interpolator = d3.interpolateRgb(fromColor, toColor);
					let ease = d3.easeExpInOut(d.getCurrent(Math.round(y / 8))/1);
					return interpolator(ease); 
				})
			})	
	});
</script>

<div class="wrapper">
	<div class='card-wrap'>
		<!-- <h1>{parsed.h1}</h1> -->
		<!-- <h1>Antibiotikaresistenz</h1>
		<h2>Ein Wettlauf mit der Evolution</h2> -->
	</div>	
	
	{#each parsed.text as paragraph}
	<div class='card-wrap'>
		<p class="card">{paragraph.value}</p>
	</div>	
	{/each}
</div>


<!-- <div class="foreground">
	You have scrolled {y} pixels
</div> -->

<!-- <svg width={w} height={h}>
	{#each cells as cell, i}
		<path 
		d={board.voronoi.renderCell(cell.getIndex())} 
		fill={function() {
			const [xPos, yPos] = cell.getPos(i);
			let perlin = noise(xPos * noiseScale, yPos * noiseScale);
			let color = Math.floor(scaleLinear(perlin));
			return "rgb(" + color + ", " + color + ", " + color + ")";}}></path>	
	{/each}
</svg> -->



<svelte:window bind:scrollY={y} bind:innerWidth={w} bind:innerHeight={h}/>

<style>

	.sim {
		position: absolute;
	}

	h1 {
		font-family: "Golos Text";
		font-weight: 700;
		line-height: 1;
		font-size: var(--56px);
		position:absolute;
        z-index: 99;
		color: black;
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
		justify-content: center;
		align-items: flex-start;
		z-index: 1;
		position: relative;
		width: 560px;
		max-width: calc(100% - 20px);
		margin: 30vh auto 50vh;
    }

    .card {
        background: rgba(255,255,255,.85);
		backdrop-filter: saturate(180%) blur(10px);
		-webkit-backdrop-filter: saturate(180%) blur(10px);
		padding: 18px 24px;
		color: black;
		max-width: 560px;
		border-radius: 4px;
		box-shadow: 0 0 20px -10px black;
    }
</style>




<!-- <Footer /> -->
