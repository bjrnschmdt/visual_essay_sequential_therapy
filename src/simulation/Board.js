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
		this.livingCells = [];
		this.livingCellsNeighbors = [];
		this.generations = new Array(this.numGenerations);
		//this.index;
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

		// Set all neighbors of starting point to candidate
		for (const neighbor of this.voronoi.neighbors(this.cells[this.index])) {
			if (this.cells[neighbor].getPrevious() == 0) {
				this.cells[neighbor].setCandidate(0, true);
			}
		};
		//this.candidates.push(this.cells[this.index]);
		//this.generations[0].push(this.livingCells.push(this.cells[this.index]));
	}

	generate() {
		// Loop through every generation
		// Generate the next generation of cells

		for (let gen = 1; gen < this.numGenerations; gen++) {
			// Loop through all the cells where the previous candidate status is true
			// Inspect the candidates and set the current state accordingly
			for (const candidate of this.cells.filter(cell => cell.isCandidate(gen - 1))) {
				inspectCandidate(candidate, this.cells, this.voronoi, gen, this.threshold);
			}

			for (const cell of this.cells.filter(cell => cell.isAlive(gen - 1))) {
				
			}

			

		}
	}
}

function inspectCandidate(candidate, cells, voronoi, gen, threshold) {

			let sumNeighbors = 0;
			let sumDistances = 0;
			let sumWeights = 0;
			let distances = [];
			let counter = 0;
			let x1 = candidate.getPos()[0];
			let y1 = candidate.getPos()[1];

			// Loop through all the neighbors of the current cell
			// Add up the distances between the current cell and its neighbors
			// Add up the previous states of the neighbors
			// Count the number of neighbors
			for (const neighbor of voronoi.neighbors(candidate.getIndex())) {
				let x2 = cells[neighbor].getPos()[0];
				let y2 = cells[neighbor].getPos()[1];
				sumDistances += dist(x1, y1, x2, y2);
				distances.push([neighbor, dist(x1, y1, x2, y2)]);
				sumNeighbors += cells[neighbor].getPrevious(gen);
				counter += 1;
			}

			// Normalize the distances between the current cell and its neighbors
			// Multiply the normalized distances by the previous states of the neighbors to get weighted states
			for (let i = 0; i < counter; i++) {
				sumWeights +=
					(sumDistances / distances[i][1]) *
					cells[distances[i][0]].getPrevious(gen);
			}

			let weightAverage = sumWeights / counter;

			// If the sum of the neighbors is above the threshold, set the current cell to the threshold 
			// and set the current candidate status to false
			
			if (weightAverage > threshold) {
				candidate.setCurrent(gen, Cell.r);
				candidate.setCandidate(gen, false);
				for (const neighbor of voronoi.neighbors(candidate.getIndex())) {
					          
				}
			} else {
				// If the sum of the neighbors is below the threshold, set the current candidate status to true
				candidate.setCandidate(gen, true);
			}
		/* } else if (candidate.getPrevious(gen) == Cell.lifetime) {
			// If the sum of the neighbors is above the max, set the state to the max
			candidate.setCurrent(gen, Cell.lifetime);			
		} else {
			// If the sum of the neighbors is above the threshold but below the max, increment the state by 1
			candidate.setCurrent(
				gen,
				candidate.getPrevious(gen) + Cell.r
			);
		}	 */	
}