import Cell from "./Cell";
import * as d3 from "d3";
import { Delaunay } from "d3-delaunay";
import { poissonDiscSampler } from "./poissonDiscSampler";
import MyWorker from "./../simulation/my-worker.worker.js?worker";

function dist(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

export default class Board {
	constructor(
		width_ = 500,
		height_ = 500,
		numGenerations,
		ctx,
		scrollY,
		innerHeight
	) {
		this.listeners = new Map();
		this.threshold = 2;
		this.numGenerations = numGenerations;
		this.radius = 16;
		this.width = width_;
		this.height = height_;
		this.ctx = ctx;
		this.scrollY = scrollY;
		this.innerHeight = innerHeight;

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
		this.generations = new Array(this.numGenerations);
		this.latestGen = 0;
		this.latestGenDamped = 0;
		this.init();
	}

	init = () => {
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
					// Here I try to render the initial state by calling the displayInitial function
					this.displayInitial(this.ctx, this.scrollY, this.innerHeight);
					break;
				default:
					console.error(`Unknown message type: ${type}`);
			}
		};

		// Populate array with cells
		for (let i = 0; i < this.points.length; i++) {
			const polygon = this.voronoi.cellPolygon(i);
			const neighbors = [...this.voronoi.neighbors(i)];
			this.worker.postMessage({
				type: "addCell",
				data: {
					x: this.points[i][0],
					y: this.points[i][1],
					index: i,
					polygon: polygon,
					neighbors: neighbors
				}
			});
		}

		// Initialize starting point for growth
		// Set state[1] to generation 0 which means that this cell is at step 1 in generation 0
		// Set state[0] of neighbors to generation 0 which means that this cell is at step 0 in generation 0
		this.index = this.delaunay.find(Math.random() * 2000, 0);
		this.worker.postMessage({
			type: "initCell",
			data: { startIndex: this.index }
		});

		// display initial state
		this.worker.postMessage({
			type: "getInitialCellsData"
		});
	};

	generate = (startGen, numGens) => {
		this.worker.postMessage({
			type: "generate",
			data: { startGen: startGen, numGens: numGens }
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
