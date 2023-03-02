<script>
	import { getContext, onMount } from "svelte";
	import Board from "./../simulation/Board";
	import * as d3 from "d3";
	import { octave, perlin2 } from "./../simulation/perlinNoise"

	let w, h, y;
	let radius = 16;
	let noiseScale = 0.001;
	let octaves = 5;
	let board;
	let cells = [];
 	let noise = octave(perlin2, octaves);

	onMount(() => {
		board = new Board(w, h, 500);
		board.generate();
		cells = board.cells;
		//console.log(board);

		let scaleLinear = d3.scaleLinear()
			.domain([-1, 1])
			.range([0, 100]);

		//Create SVG element
		var svg = d3.select("main")
		.append("svg")
		.attr("width", w)
		.attr("height", h);

		//Create polygons
		svg.selectAll("path")
		.data(board.points)
		.enter()
		.append("path")
		.attr("d", function (d, i) {
        	return board.voronoi.renderCell(i);
    		})
    	.attr("stroke", "black")
    	.attr("stroke-width", "1px")
		.attr("fill", function(d) {
			var perlin = noise(d[0] * noiseScale, d[1] * noiseScale);
			var color = Math.floor(scaleLinear(perlin));
			return "rgb(" + color + ", " + color + ", " + color + ")";
		})


		d3.select(window)
		.on("scroll", function(e) {
			svg.selectAll("path")
			.data(board.cells)
			//.transition()
			//.duration(100)
			.attr("fill", function(d, i) {
				var [xPos, yPos] = d.getPos();
				var perlin = noise(xPos * noiseScale, yPos * noiseScale);
				var p = Math.floor(scaleLinear(perlin));
				var fromColor = d3.rgb(p, p, p);
				var toColor = d3.rgb("white");
				var ease = d3.easeExpInOut(d.getCurrent(Math.round(y / 4))/1);
				var color = Math.floor(scaleLinear(perlin));
				var interpolator = d3.interpolateRgb(fromColor, toColor);
				return interpolator(ease); 

		})
	})
		
		
	});
	
</script>

<!-- <div class="foreground">
	You have scrolled {y} pixels
</div> -->

<!-- <svg width={w} height={h}>
	{#each cells as cell, i}
		<path 
		d={board.voronoi.renderCell(cell.getIndex())} 
		fill={function() {
			const [xPos, yPos] = cell.getPos(i);
			var perlin = noise(xPos * noiseScale, yPos * noiseScale);
			var color = Math.floor(scaleLinear(perlin));
			return "rgb(" + color + ", " + color + ", " + color + ")";}}></path>	
	{/each}
</svg> -->



<svelte:window bind:scrollY={y} bind:innerWidth={w} bind:innerHeight={h}/>






<!-- <Footer /> -->
