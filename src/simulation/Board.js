import Cell from "./Cell";
import * as d3 from "d3";
import { Delaunay } from "d3-delaunay";
import { poissonDiscSampler } from "./poissonDiscSampler";
import MyWorker from "./../simulation/my-worker.worker.js?worker";
import { Poline } from "poline";
import { formatRgb } from "culori";
/* const fs = require("fs"); */

function dist(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

export default class Board {
	constructor(
		width_ = 500,
		height_ = 500,
		ctx,
		scrollY,
		innerHeight,
		dampFactor,
		boundingBoxes,
		RgbColors
	) {
		this.listeners = new Map();
		this.threshold = 2;
		this.radius = 16;
		this.width = width_;
		this.height = height_;
		this.ctx = ctx;
		this.scrollY = scrollY;
		this.innerHeight = innerHeight;
		this.dampFactor = dampFactor;
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
		this.cellsData = [];
		this.livingCells = [];
		this.livingCellsNeighbors = [];
		this.latestGen = 0;
		this.latestGenDamped = 0;
		this.boundingBoxes = boundingBoxes;
		this.numIntervals = boundingBoxes.length;
		this.RgbColors = RgbColors;
		this.init();
	}

	init = () => {
		const interval = this.height / this.numIntervals;
		// Create a new worker
		this.worker = new MyWorker();
		// Set up the message handler for the worker
		this.worker.onmessage = (event) => {
			const { type, data } = event.data;
			switch (type) {
				case "updateCells":
					const { batchUpdates, gen } = data;
					this.latestGen = gen;
					for (let updatedCellData of batchUpdates) {
						this.cellsData[updatedCellData.index] = updatedCellData;
					}
					break;
				case "setInitialCellsData":
					this.cellsData = data;
					this.totalCellsInMedium = this.getMediumCounts(this.cellsData);
					/* console.log(
						"board mediumCounts:",
						Object.keys(this.totalCellsInMedium).length,
						this.totalCellsInMedium
					); */
					// Here I try to render the initial state by calling the displayInitial function
					console.log("displayInitial");
					this.displayInitial(this.ctx, this.scrollY, this.innerHeight);
					break;
				default:
					console.error(`Unknown message type: ${type}`);
			}
		};

		// Populate array with cells
		for (const [i, [x, y]] of this.points.entries()) {
			const roundedY = Math.round(y);
			const polygon = this.voronoi.cellPolygon(i);
			const neighbors = [...this.voronoi.neighbors(i)];
			let color;
			for (let j = 0; j < this.boundingBoxes.length; j++) {
				const { top, height } = this.boundingBoxes[j];
				if (roundedY >= top && roundedY <= top + height) {
					color = this.RgbColors[j];
					break;
				}
			}
			this.worker.postMessage({
				type: "addCell",
				data: {
					x: x,
					y: y,
					index: i,
					polygon: polygon,
					neighbors: neighbors,
					medium: color
				}
			});
		}

		// Initialize starting point for growth
		// Set state[1] to generation 0 which means that this cell is at step 1 in generation 0
		// Set state[0] of neighbors to generation 0 which means that this cell is at step 0 in generation 0
		this.index = this.delaunay.find(Math.random() * 2000, 0);
		this.worker.postMessage({
			type: "initCells",
			data: { startIndex: this.index, dampFactor: this.dampFactor }
		});

		// display initial state
		this.worker.postMessage({
			type: "getInitialCellsData"
		});
	};

	generate = (startGen, numGens) => {
		/* console.log(
			"board generate mediumCount:",
			this.mediumCounts
		); */
		this.worker.postMessage({
			type: "generate",
			data: {
				startGen: startGen,
				numGens: numGens,
				mediumCounts: this.mediumCounts
			}
		});
	};

	display = (ctx, scrollY, innerHeight, currentGen, currentGenDamped) => {
		this.latestGenDamped = updateGen(
			d3.min([this.latestGen, currentGen]),
			this.latestGenDamped
		);

		const gen = d3.min([currentGenDamped, this.latestGenDamped]);

		for (const cell of this.getVisibleCells(
			this.cellsData,
			scrollY,
			innerHeight
		)) {
			ctx.beginPath();
			this.voronoi.renderCell(cell.index, ctx);
			ctx.strokeStyle = d3
				.color(getColor(cell, Math.round(gen)))
				.brighter()
				.formatRgb();
			ctx.stroke();
			ctx.fillStyle = getColor(cell, Math.round(gen));
			ctx.fill();
			ctx.closePath();
		}
	};

	displayInitial = (ctx, scrollY, innerHeight) => {
		for (const cell of this.getVisibleCells(
			this.cellsData,
			scrollY,
			innerHeight
		)) {
			ctx.beginPath();
			this.voronoi.renderCell(cell.index, ctx);
			ctx.strokeStyle = d3.color(cell.color[0]).brighter().formatRgb();
			ctx.stroke();
			ctx.fillStyle = cell.color[0];
			ctx.fill();
			ctx.closePath();
		}
	};

	getVisible = (scrollY, innerHeight) => {
		return this.getVisibleCells(this.cellsData, scrollY, innerHeight);
	};

	getVisibleCells = (cells, scrollY, innerHeight) => {
		// Compute the visible cells
		let visibleCells = cells.filter((cell) => {
			let bbox = cell.boundingBox;
			return (
				(bbox.maxY > scrollY && bbox.maxY < scrollY + innerHeight) ||
				(bbox.minY > scrollY && bbox.minY < scrollY + innerHeight)
			);
		});
		return visibleCells;
	};

	/**
	 * Returns an object containing the count of each medium in the given array of cells.
	 * @param {Array} cells - An array of cell objects.
	 * @returns {Object} An object containing the count of each medium in the given array of cells.
	 */
	getMediumCounts = (cellsData) => {
		cellsData.sort((a, b) => a.boundingBox.minY - b.boundingBox.minY);

		const count = cellsData.reduce((acc, cell) => {
			if (!acc[cell.medium]) {
				acc[cell.medium] = 0;
			}
			acc[cell.medium]++;
			return acc;
		}, {});
		return count;
	};
}

function getColor(cell, gen) {
	return isAlive(cell, gen)
		? cell.color[getCurrentStateIndex(cell, gen)]
		: isDead(cell, gen)
		? cell.color[Cell.lifetime - 1]
		: cell.color[0];
}

function isAlive(cell, gen) {
	return cell.state.includes(gen);
}

function getCurrentStateIndex(cell, gen) {
	return cell.state.indexOf(gen);
}

function isDead(cell, gen) {
	if (cell.state.length === 0) {
		return false;
	}
	return gen > cell.state[cell.state.length - 1];
}

function updateGen(currentGen, previousGenDamped) {
	const dGenDamped = currentGen - previousGenDamped;
	return (previousGenDamped += dGenDamped / 16);
}
