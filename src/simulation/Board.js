import Cell from "./Cell";
import { Delaunay } from "d3-delaunay";
import { poissonDiscSampler } from "./poissonDiscSampler";

function dist(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

export default class Board {
	constructor(width_ = 500, height_ = 500, numGenerations) {
		this.threshold = Cell.r;
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
		this.index;
		this.init();
	}

	init() {
		// Populate array with cells
		for (let i = 0; i < this.points.length; i++) {
			this.cells[i] = new Cell(
				this.points[i][0],
				this.points[i][1],
				i,
				this.numGenerations
			);
		}
		// Initialize starting point for growth
		this.index = this.delaunay.find(Math.random() * 2000, 0);
		this.cells[this.index].setCurrent(0, Cell.r);
	}

	generate() {
		// Loop through every generation
		// Generate the next generation of cells

		for (let gen = 1; gen < this.numGenerations; gen++) {
			// Loop through every spot in our 1D cell array and check neighbors
			for (let cell = 0; cell < this.cells.length; cell++) {
				if (this.cells[cell].getPrevious(gen) < this.threshold) {
					// If the state of the previous gen is below the threshold, check if the neighbors states are above the threshold
					
					let sumNeighbors = 0;
					let sumDistances = 0;
					let sumWeights = 0;
					let distances = [];
					let counter = 0;
					let x1 = this.points[cell][0];
					let y1 = this.points[cell][1];

					// Loop through all the neighbors of the current cell
					// Add up the distances between the current cell and its neighbors
					// Add up the previous states of the neighbors
					// Count the number of neighbors
					for (const neighbor of this.voronoi.neighbors(cell)) {
						let x2 = this.points[neighbor][0];
						let y2 = this.points[neighbor][1];
						sumDistances += dist(x1, y1, x2, y2);
						distances.push([neighbor, dist(x1, y1, x2, y2)]);
						sumNeighbors += this.cells[neighbor].getPrevious(gen);
						counter += 1;
					}

					// Normalize the distances between the current cell and its neighbors
					// Multiply the normalized distances by the previous states of the neighbors to get weighted states
					for (let i = 0; i < counter; i++) {
						sumWeights +=
							(sumDistances / distances[i][1]) *
							this.cells[distances[i][0]].getPrevious(gen);
					}

					let weightAverage = sumWeights / counter;

					// If the sum of the neighbors is above the threshold, set the current cell to the threshold
					if (weightAverage > this.threshold) {
						this.cells[cell].setCurrent(gen, Cell.r);
					}
				} else if (this.cells[cell].getPrevious(gen) == Cell.lifetime) {
					// If the sum of the neighbors is above the max, set the state to the max
					this.cells[cell].setCurrent(gen, Cell.lifetime);
					
				} else {
					// If the sum of the neighbors is above the threshold but below the max, increment the state by 1
					this.cells[cell].setCurrent(
						gen,
						this.cells[cell].getPrevious(gen) + Cell.r
					);
				}
			}
		}
	}
}
