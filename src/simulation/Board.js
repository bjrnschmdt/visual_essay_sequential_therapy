import Cell from "./Cell";
import { Delaunay } from "d3-delaunay";
import { poissonDiscSampler } from "./poissonDiscSampler";

function dist(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

export default class Board {
	constructor(width_ = 500, height_ = 500, numGenerations) {
		this.threshold = 2;
		this.numGenerations = numGenerations;
		this.radius = 16;
		this.width = width_;
		this.height = height_;

		this.points = [
			...poissonDiscSampler(0, 0, this.width, this.height, this.radius)
		];
		this.delaunay = Delaunay.from(this.points);
		this.voronoi = this.delaunay.voronoi([
			0.5,
			0.5,
			this.width - 0.5,
			this.height - 0.5
		]);
		this.cells = new Array(this.points.length);
		this.livingCells = [];
		this.livingCellsNeighbors = [];
		this.generations = new Array(this.numGenerations);
		//this.index;
		this.init();
	}

	init() {
		// Populate array with cells
		for (let i = 0; i < this.points.length; i++) {
			this.cells[i] = new Cell(this.points[i][0], this.points[i][1], i);
		}

		// Initialize starting point for growth
		// Set state[1] to generation 0 which means that this cell is at step 1 in generation 0
		// Set state[0] of neighbors to generation 0 which means that this cell is at step 0 in generation 0
		this.index = this.delaunay.find(Math.random() * 2000, 0);
		this.cells[this.index].setCurrent(1, 0);

		for (const neighbor of this.voronoi.neighbors(
			this.cells[this.index].getIndex()
		)) {
			this.cells[neighbor].setCurrent(0, 0);
		}
	}

	generate() {
		// Loop through every generation
		// Generate the next generation of cells

		for (let gen = 1; gen < this.numGenerations; gen++) {
			// Filter and loop through all cells that where state[0] equals the previous generations index
			this.cells
				.filter((cell) => cell.getState(0) == gen - 1)
				.forEach((cell) => {
					// Get the neighbors of the cells
					for (const neighbor of this.voronoi.neighbors(cell.getIndex())) {
						// only inspect the neighbors that are not alive in the previous generation
						if (!this.cells[neighbor].isAlive(gen - 1)) {
							// Inspect the candidate and set its current state if necessary
							inspectCandidate(
								this.cells[neighbor],
								this.cells,
								this.voronoi,
								gen,
								this.threshold
							);
						}
					}
				});

			// Filter for cells that are alive in the previous gerneration and loop through all the cells where state[] includes the previous generation
			// Inspect the cells and set the current state accordingly
			this.cells
				.filter((cell) => cell.isAlive(gen - 1))
				.forEach((cell) => {
					let index = cell.getPreviousStateIndex(gen);
					if (index + 1 < Cell.lifetime) {
						cell.setCurrent(index + 1, gen);
					}
				});
		}
	}
}

function inspectCandidate(candidate, cells, voronoi, gen, threshold) {
	let sumNeighbors = 0;

	for (const neighbor of voronoi.neighbors(candidate.getIndex())) {
		// skip all neighbors that are not alive in the previous generation
		if (cells[neighbor].isAlive(gen - 1)) {
			sumNeighbors += 1;
		}
	}

	if (sumNeighbors >= threshold) {
		candidate.setCurrent(0, gen);
	}
}
