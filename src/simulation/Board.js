import Cell from "./Cell";
import * as d3 from "d3";
import { Delaunay } from "d3-delaunay";
import { poissonDiscSampler } from "./poissonDiscSampler";
import MyWorker from "./../simulation/my-worker.worker.js?worker";
import { writable } from "svelte/store";
/* import { theme } from "$stores/theme.js";

let themeValue;
theme.subscribe((value) => {
	themeValue = value;
}); */

const THRESHOLD = 2;
const RADIUS = 16;
const GEN_DAMPED = -30;
const EASE_FACTOR = 16;
export let cellsDataStore = writable([]);

// Define the number of generations to generate at a time
const NUM_GENERATIONS = 1000;

// Define the starting generation number
const START_GEN = -30;

const INTERVAL = 100;

export default class Board {
	constructor(
		width_ = 500,
		height_ = 500,
		ctx,
		scrollY,
		innerHeight,
		dampFactor,
		boundingBoxes,
		RgbColors,
		themeValue
	) {
		this.listeners = new Map();
		this.threshold = THRESHOLD;
		this.radius = RADIUS;
		this.width = width_;
		this.height = height_;
		this.ctx = ctx;
		this.scrollY = scrollY;
		this.innerHeight = innerHeight;
		this.dampFactor = dampFactor;
		this.genCurrent = scrollY / dampFactor;
		this.genDamped = GEN_DAMPED;
		this.genDelta = this.genCurrent - this.genDamped;
		this.genLastRendered = null;
		this.easeFactor = EASE_FACTOR;
		this.themeValue = themeValue;
		this.points = [
			...poissonDiscSampler(0, 0, this.width, this.height, this.radius)
		];
		this.quadtree = d3
			.quadtree()
			.extent([
				[0, 0],
				[this.width, this.height]
			])
			.addAll(this.points.map((point, index) => [...point, index]));
		/* this.visibleCellsCache = new Map(); */
		this.visibleCellsCache = {};

		this.delaunay = Delaunay.from(this.points);
		this.voronoi = this.delaunay.voronoi([
			0.5,
			0.5,
			this.width - 0.5,
			this.height - 0.5
		]);
		/* this.quadtree = null; */
		this.cellsData = [];
		this.livingCells = [];
		this.livingCellsNeighbors = [];
		this.latestComputedGen = 0;
		this.latestComputedGenDamped = 0;
		this.boundingBoxes = boundingBoxes;
		this.numIntervals = boundingBoxes.length;
		this.RgbColors = RgbColors;
		/* this.offscreenCanvas = document.createElement("canvas");
		this.offscreenCanvas.width = this.width;
		this.offscreenCanvas.height = this.innerHeight + dampFactor; // add some padding
		this.offscreenCtx = this.offscreenCanvas.getContext("2d"); */

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
					this.latestComputedGen = gen;
					for (let updatedCellData of batchUpdates) {
						this.cellsData[updatedCellData.index] = updatedCellData;
					}
					/* console.log("Updated cellsData:", gen, { ...this.cellsData }); */

					break;
				case "setInitialCellsData":
					const cellsData = data;

					/* this.cellsData = data; */
					for (let updatedCellData of cellsData) {
						if (
							typeof updatedCellData.index !== "number" ||
							updatedCellData.index < 0
						) {
							console.error("Invalid index:", updatedCellData.index);
							continue;
						}
						this.cellsData[updatedCellData.index] = updatedCellData;
					}
					cellsDataStore.set(data);

					this.totalCellsInMedium = this.getMediumCounts(this.cellsData);
					/* console.log(
						"board mediumCounts:",
						Object.keys(this.totalCellsInMedium).length,
						this.totalCellsInMedium
					); */
					// Here I try to render the initial state by calling the displayInitial function
					/* this.displayInitial(JSON.parse(JSON.stringify(data))); */
					this.displayInitial(this.cellsData);

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
		/* this.worker.postMessage({
			type: "getInitialCellsData"
		}); */
	};

	generate = () => {
		/* console.log(
			"board generate mediumCount:",
			this.mediumCounts
		); */
		this.worker.postMessage({
			type: "generate",
			data: {
				startGen: START_GEN,
				numGens: NUM_GENERATIONS,
				mediumCounts: this.mediumCounts
			}
		});
	};

	update = (genDamped) => {
		//const generation = Math.floor(scrollY / this.dampFactor);
		const genDampedRounded = Math.round(genDamped);
		if (this.lastRenderedGen !== genDampedRounded) {
			// Update the board's state based on the new generation.
			// Draw the updated state to the offscreen canvas.
			this.drawToOffscreenCanvas(genDamped);
			this.lastRenderedGen = genDampedRounded;
		}
	};

	drawToOffscreenCanvas = (genDamped) => {
		const genDampedRounded = Math.round(genDamped);
		let visibleIndices;
		if (this.visibleCellsCache.has(genDampedRounded)) {
			visibleIndices = this.visibleCellsCache.get(genDampedRounded);
		} else {
			visibleIndices = this.getVisibleCells(
				genDamped * this.dampFactor,
				this.innerHeight
			);
			this.visibleCellsCache.set(genDampedRounded, visibleIndices);
		}

		/* console.log("visibleCells Cache:", this.visibleCellsCache); */
		const genPos = Math.round(genDamped * this.dampFactor);
		this.offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
		this.offscreenCtx.translate(0, -genPos);

		for (const index of visibleIndices) {
			this.offscreenCtx.beginPath();
			this.voronoi.renderCell(index, this.offscreenCtx);
			this.offscreenCtx.strokeStyle = d3
				.color(getColor(this.cellsData[index], genDampedRounded))
				.brighter()
				.formatRgb();
			this.offscreenCtx.stroke();
			this.offscreenCtx.fillStyle = getColor(
				this.cellsData[index],
				genDampedRounded
			);
			this.offscreenCtx.fill();
			this.offscreenCtx.closePath();
		}
		this.lastRenderedGen = genDampedRounded;
	};

	render(mainCtx, scrollY) {
		// Copy the relevant portion of the offscreen canvas to the main canvas.
		/* console.log("scrollY:", scrollY, "offset:", scrollY % this.dampFactor); */
		mainCtx.drawImage(
			this.offscreenCanvas,
			0,
			scrollY % this.dampFactor,
			this.width,
			this.innerHeight,
			0,
			0,
			this.width,
			this.innerHeight
		);
	}

	display = (genDamped) => {
		/* console.log(
			"display visibleCells:",
			this.getVisibleCells(scrollY, innerHeight)
		); */
		const genDampedRounded = Math.round(genDamped);

		/* if (this.lastRenderedGen !== roundedGenDamped) { */
		/* console.log("roundedGenDamped:", roundedGenDamped); */
		// Render logic
		/* let visibleIndices;
		if (this.visibleCellsCache.has(genDampedRounded)) {
			visibleIndices = this.visibleCellsCache.get(genDampedRounded);
		} else {
			visibleIndices = this.getVisibleCells(scrollY, this.innerHeight);
			this.visibleCellsCache.set(scrollY, visibleIndices);
		} */

		let visibleIndices = this.getVisibleCells(scrollY, this.innerHeight);
		/* console.log("display visibleIndices:", visibleIndices); */
		/* const visibleIndices = this.getVisibleCellsCache(); */

		for (const index of visibleIndices) {
			const cell = this.cellsData[index];
			this.ctx.beginPath();
			this.voronoi.renderCell(index, this.ctx);
			this.ctx.strokeStyle = d3
				.color(getColor(cell, genDampedRounded, this.themeValue))
				.brighter()
				.formatRgb();
			this.ctx.stroke();
			this.ctx.fillStyle = getColor(cell, genDampedRounded, this.themeValue);
			this.ctx.fill();
			this.ctx.closePath();
		}
		this.lastRenderedGen = genDampedRounded;
		/* } */
	};

	displayInitial = (cellsData) => {
		this.initialCellsDataInit = this.cellsData;

		/* console.log("Display Initial Cells Data:", { ...cellsData }); */
		let visibleIndices = this.getVisibleCells(scrollY, this.innerHeight);
		/* for (const index of visibleIndices) {
			const cell = this.cellsData[index];
			console.log("cell color:", cell.color[0]);
		} */
		/* console.log("initial display visibleIndices:", visibleIndices); */
		for (const index of visibleIndices) {
			const cell = cellsData[index];
			/* console.log("color:", this.cellsData[index].color[0]); */
			this.ctx.beginPath();
			this.voronoi.renderCell(index, this.ctx);
			this.ctx.strokeStyle =
				this.themeValue === "dark"
					? d3.color(cell.color[0]).brighter().formatRgb()
					: d3.color(cell.colorLight[0]).brighter().formatRgb();
			this.ctx.stroke();
			this.ctx.fillStyle =
				this.themeValue === "dark" ? cell.color[0] : cell.colorLight[0];
			this.ctx.fill();
			this.ctx.closePath();
		}
		this.generate();
	};

	getVisible = (scrollY, innerHeight) => {
		return this.getVisibleCells(this.cellsData, scrollY, innerHeight);
	};

	/* getVisibleCells = (cells, scrollY, innerHeight) => {
		// Compute the visible cells
		let visibleCells = cells.filter((cell) => {
			let bbox = cell.boundingBox;
			return (
				(bbox.maxY > scrollY && bbox.maxY < scrollY + innerHeight) ||
				(bbox.minY > scrollY && bbox.minY < scrollY + innerHeight)
			);
		});
		return visibleCells;
	}; */

	getVisibleCells = (scrollY, innerHeight) => {
		let visibleIndices = [];

		let topBound = scrollY - 8;
		let bottomBound = scrollY + innerHeight + this.dampFactor + 8;

		this.quadtree.visit((node, x1, y1, x2, y2) => {
			// Check if node's bounding box is outside the expanded viewport; if so, skip its children
			if (y2 < topBound || y1 > bottomBound) return true;

			// If leaf node, add index to visibleIndices
			if (!node.length) {
				let dataIndex = node.data[2]; // Retrieve the index
				visibleIndices.push(dataIndex);
			}
		});

		return visibleIndices;
	};

	/* getVisibleCells = (visibleRect) => {
		let visibleIndices = [];

		let topBound = visibleRect.top - 8;
		let bottomBound = visibleRect + 8;

		this.quadtree.visit((node, x1, y1, x2, y2) => {
			// Check if node's bounding box is outside the expanded viewport; if so, skip its children
			if (y2 < topBound || y1 > bottomBound) return true;

			// If leaf node, add index to visibleIndices
			if (!node.length) {
				let dataIndex = node.data[2]; // Retrieve the index
				visibleIndices.push(dataIndex);
			}
		});

		return visibleIndices;
	}; */

	getVisibleCellsCache() {
		const interval = INTERVAL;
		const key = Math.floor(scrollY / interval) * interval; // This gets the nearest lower multiple of 100

		if (!this.visibleCellsCache[key]) {
			const extendedViewportHeight = innerHeight + 2 * interval; // Expanding by 100px on top and bottom
			const visibleRect = {
				top: key - interval,
				bottom: key + extendedViewportHeight
			};

			this.visibleCellsCache[key] = this.getVisibleCells(visibleRect);
		}
		/* console.log("visibleCellsCache:", this.visibleCellsCache); */
		return this.visibleCellsCache[key];
	}

	/**
	 * Returns an object containing the count of each medium in the given array of cells.
	 * @param {Array} cells - An array of cell objects.
	 * @returns {Object} An object containing the count of each medium in the given array of cells.
	 */
	getMediumCounts = (cellsData) => {
		const sortedCellsData = [...cellsData].sort(
			(a, b) => a.boundingBox.minY - b.boundingBox.minY
		);

		const count = sortedCellsData.reduce((acc, cell) => {
			if (!acc[cell.medium]) {
				acc[cell.medium] = 0;
			}
			acc[cell.medium]++;
			return acc;
		}, {});
		return count;
	};
}

function getColor(cell, gen, themeValue) {
	if (themeValue === "dark") {
		return isAlive(cell, gen)
			? cell.color[getCurrentStateIndex(cell, gen)]
			: isDead(cell, gen)
			? cell.color[Cell.lifetime - 1]
			: cell.color[0];
	} else if (themeValue === "light") {
		return isAlive(cell, gen)
			? cell.colorLight[getCurrentStateIndex(cell, gen)]
			: isDead(cell, gen)
			? cell.colorLight[Cell.lifetime - 1]
			: cell.colorLight[0];
	}
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
