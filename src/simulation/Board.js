import Cell from "./Cell";
import { Delaunay } from "d3-delaunay";

export default class Board {
	constructor(width = 500, height = 500, numGenerations) {
		this.threshold = Cell.r;
		this.numGenerations = numGenerations;
		this.radius = 16;
		this.width = width;
		this.height = height;

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
		for (var i = 0; i < this.points.length; i++) {
			this.cells[i] = new Cell(
				this.points[i][0],
				this.points[i][1],
				i,
				this.numGenerations
			);
		}
		// Initialize starting point for growth
		this.index = this.delaunay.find(
			Math.random() * this.width,
			(Math.random() * this.height) / 2
		);

		this.cells[this.index].setCurrent(0, Cell.r);
	}

	generate() {
		for (var gen = 1; gen < this.numGenerations; gen++) {
			// Loop through every spot in our 1D cell array and check neighbors
			for (var cell = 0; cell < this.cells.length; cell++) {
				if (this.cells[cell].state[gen - 1] < this.threshold) {
					// Add up all the states of the neighboring cells
					var sumNeighbors = 0;
					var sumDistances = 0;
					var sumWeights = 0;
					var distances = [];
					var counter = 0;
					var x1 = this.points[cell][0];
					var y1 = this.points[cell][1];
					//var neighbors = 0;
					for (const neighbor of this.voronoi.neighbors(cell)) {
						var x2 = this.points[neighbor][0];
						var y2 = this.points[neighbor][1];
						sumDistances += dist(x1, y1, x2, y2);
						distances.push([neighbor, dist(x1, y1, x2, y2)]);
						sumNeighbors += this.cells[neighbor].getPrevious(gen);
						counter += 1;
					}

					for (var i = 0; i < counter; i++) {
						sumWeights +=
							(sumDistances / distances[i][1]) *
							this.cells[distances[i][0]].getPrevious(gen);
					}

					var weightAverage = sumWeights / counter;

					if (weightAverage > this.threshold) {
						this.cells[cell].setCurrent(gen, Cell.r);
					}
				} else if (this.cells[cell].state[gen - 1] == Cell.lifetime) {
					return;
				} else {
					this.cells[cell].setCurrent(
						gen,
						this.cells[cell].getPrevious(gen) + Cell.r
					);
				}
			}
		}
	}
}

function* poissonDiscSampler(x0, y0, x1, y1, radius) {
	const k = 30; // maximum number of samples before rejection
	const width = x1 - x0;
	const height = y1 - y0;
	const radius2 = radius * radius;
	const radius2_3 = 3 * radius2;
	const cellSize = radius * Math.SQRT1_2;
	const gridWidth = Math.ceil(width / cellSize);
	const gridHeight = Math.ceil(height / cellSize);
	const grid = new Array(gridWidth * gridHeight);
	const queue = [];

	// Pick the first sample.
	yield sample(
		width / 2 + Math.random() * radius,
		height / 2 + Math.random() * radius
	);

	// Pick a random existing sample from the queue.
	pick: while (queue.length) {
		const i = (Math.random() * queue.length) | 0;
		const parent = queue[i];

		// Make a new candidate between [radius, 2 * radius] from the existing sample.
		for (let j = 0; j < k; ++j) {
			const a = 2 * Math.PI * Math.random();
			const r = Math.sqrt(Math.random() * radius2_3 + radius2);
			const x = parent[0] + r * Math.cos(a);
			const y = parent[1] + r * Math.sin(a);

			// Accept candidates that are inside the allowed extent
			// and farther than 2 * radius to all existing samples.
			if (0 <= x && x < width && 0 <= y && y < height && far(x, y)) {
				yield sample(x, y);
				continue pick;
			}
		}

		// If none of k candidates were accepted, remove it from the queue.
		const r = queue.pop();
		if (i < queue.length) queue[i] = r;
	}

	function far(x, y) {
		const i = (x / cellSize) | 0;
		const j = (y / cellSize) | 0;
		const i0 = Math.max(i - 2, 0);
		const j0 = Math.max(j - 2, 0);
		const i1 = Math.min(i + 3, gridWidth);
		const j1 = Math.min(j + 3, gridHeight);
		for (let j = j0; j < j1; ++j) {
			const o = j * gridWidth;
			for (let i = i0; i < i1; ++i) {
				const s = grid[o + i];
				if (s) {
					const dx = s[0] - x;
					const dy = s[1] - y;
					if (dx * dx + dy * dy < radius2) return false;
				}
			}
		}
		return true;
	}

	function sample(x, y, parent) {
		queue.push(
			(grid[gridWidth * ((y / cellSize) | 0) + ((x / cellSize) | 0)] = [x, y])
		);
		return [x + x0, y + y0];
	}
}

function dist(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}
