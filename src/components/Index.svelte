<script>
	import { getContext, onMount } from "svelte";
	import Board from "./../simulation/Board";
	import * as d3 from "d3";

	let w, h, y;
	let radius = 16;

	onMount(() => {
		let board = new Board(w, h);
		board.generate();
		//Create SVG element
	var svg = d3.select("body")
		.append("svg")
		.attr("width", w)
		.attr("height", h);

	//Create polygons
		svg.selectAll("g")
		.data(board.board)
		.enter()
		.append("g")
		.selectAll("polygon")
		.data(function(d) {return d})
		.enter()
		.append("polygon")
		.attr("points", function (d) {
        	return (d.x - Math.sqrt(3) * radius / 2) + "," + (d.y - radius / 2) + " " +
			(d.x) + "," + (d.y - radius) + " " +
			(d.x + Math.sqrt(3) * radius / 2) + "," + (d.y - radius / 2) + " " +
			(d.x + Math.sqrt(3) * radius / 2) + "," + (d.y + radius / 2) + " " +
			(d.x) + "," + (d.y + radius) + " " +
			(d.x - Math.sqrt(3) * radius / 2) + "," + (d.y + radius / 2);
    		})
    	.attr("stroke", "white")
    	.attr("stroke-width", "1px")
    	.style("fill", "black");
	});
	
		
		
	
</script>

<svelte:window bind:scrollY={y} bind:innerWidth={w} bind:innerHeight={h}/>


<!-- <Footer /> -->
