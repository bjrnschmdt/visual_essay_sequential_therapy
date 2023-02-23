import Cell from "./Cell";

export default class Board {
	constructor(width, height) {
		this.radius = 16;

		this.offsetInner = Math.sqrt(3) * this.radius;
		this.offsetOuter = (3.0 / 2.0) * this.radius;

		this.cols = Math.floor(width / this.offsetInner);
		this.rows = Math.floor(height / this.offsetOuter);

		this.board = new Array(this.cols);
		for (var i = 0; i < this.cols; i++) {
			this.board[i] = new Array(this.rows);
		}

		this.init();
	}

	init() {
		for (var i = 0; i < this.cols; i++) {
			for (var j = 0; j < this.rows; j++) {
				var center = oddr_offset_to_pixel(i, j, this.radius);
				this.board[i][j] = new Cell(center[0], center[1], 0);
			}
		}

		//this.board[Math.random(this.cols)][1].counter = 1;
		//this.board[Math.random(this.cols)][1].counter = 1;

		//this.getNeighbors();
	}

	generate() {
		for (var i = 0; i < this.cols; i++) {
			for (var j = 0; j < this.rows; j++) {
				this.board[i][j].savePrevious();
			}
		}

		// Loop through every spot in our 2D array and check spots neighbors
		for (var col = 1; col < this.cols - 1; col++) {
			for (var row = 1; row < this.rows - 1; row++) {
				// Add up all the states in the surrounding grid
				var neighbors = Array(6);
				for (var i = 0; i < neighbors.length; i++) {
					neighbors[i] = oddr_offset_neighbor(col, row, i, this.board); // coordinates for pointy top neighbors
				}

				if (this.board[col][row].previous == 0) {
					var neighborScore = 0;
					neighborScore =
						neighbors[0].previous * 0.5 +
						neighbors[1].previous * 1.0 +
						neighbors[2].previous * 1.0 +
						neighbors[3].previous * 0.5 +
						neighbors[4].previous * 0.2 +
						neighbors[5].previous * 0.2;
					if (neighborScore / 6 > 1) {
						//counter = noise(u * noiseScale, v * noiseScale, counter * noiseScale);
						//this.board[col][row].counter = 1;
						this.board[col][row].newState(1);
					}
				} else if (this.board[col][row].previous == lifetime) {
					return;
				} else {
					//counter += noise(u * noiseScale, v * noiseScale, counter * noiseScale);
					//this.board[col][row].counter += 1;
					this.board[col][row].newState(previous + 1);
				}
			}
		}
	}
}

// lookup for direction differences in odd columns
var oddq_direction_differences = [
	// even cols
	[
		[+1, 0],
		[+1, -1],
		[0, -1],
		[-1, -1],
		[-1, 0],
		[0, +1]
	],
	// odd cols
	[
		[+1, +1],
		[+1, 0],
		[0, -1],
		[-1, 0],
		[-1, +1],
		[0, +1]
	]
];

// coordinates of neighbor in odd column layout
function oddq_offset_neighbor(cell, direction, board) {
	var parity = cell.u % 2;
	var diff = oddq_direction_differences[parity][direction];
	return board[cell.u + diff[0]][cell.v + diff[1]];
}

// lookup for direction differences in odd rows
var oddr_direction_differences = [
	// even rows
	[
		[+1, 0],
		[0, -1],
		[-1, -1],
		[-1, 0],
		[-1, +1],
		[0, +1]
	],
	// odd rows
	[
		[+1, 0],
		[+1, -1],
		[0, -1],
		[-1, 0],
		[0, +1],
		[+1, +1]
	]
];

// coordinates of neighbor in odd row layout
function oddr_offset_neighbor(col, row, direction, board) {
	var parity = row % 2;
	var diff = oddr_direction_differences[parity][direction];
	return board[col + diff[0]][row + diff[1]];
}

// Utility functions

// get pixel coordinates from odd columns
function oddq_offset_to_pixel(col, row, size) {
	var x = ((size * 3) / 2) * col + col;
	var y = size * Math.sqrt(3) * (row + 0.5 * (col % 2));
	return x, y;
}

// get pixel coordinates from odd rows
function oddr_offset_to_pixel(col, row, size) {
	var array = Array(2);
	array[0] = size * Math.sqrt(3) * (col + 0.5 * (row % 2));
	array[1] = ((size * 3) / 2) * row;
	return array;
}
