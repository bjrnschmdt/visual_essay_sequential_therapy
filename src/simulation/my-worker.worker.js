// my-worker.worker.js

import { init } from "svelte/internal";
import Cell from "./Cell";

const BATCH_SIZE = 3000;
let batchCounter = 0;

let cells = [];
let cellsData = [];

// Maintain separate arrays for alive and candidate cells
let aliveCellIndizes = new Set();
let candidateCellIndizes = new Set();
let updatedCellIndizes = new Set();

// Batch updates
let batchUpdates = [];

onmessage = (event) => {
	const { type, data } = event.data;

	switch (type) {
		case "addCell":
			const { x, y, index, polygon, neighbors, medium } = data;
			cells.push(new Cell(x, y, index, polygon, neighbors, medium));
			cellsData.push({
				index: index,
				boundingBox: cells[index].getBoundingBox(),
				color: cells[index].color,
				state: cells[index].state,
				medium: medium
			});
			break;
		case "initCell":
			const { startIndex } = data;
			cells[startIndex].setCurrent(1, 0);
			aliveCellIndizes.add(startIndex);
			for (const neighborIndex of cells[startIndex].neighbors) {
				cells[neighborIndex].setCurrent(0, 0);
				candidateCellIndizes.add(neighborIndex);
			}
			break;
		case "initCells":
			initCellBands(cells);
			break;
		case "getInitialCellsData":
			postMessage({
				type: "setInitialCellsData",
				data: cellsData
			});
			break;
		case "generate":
			const { startGen, numGens, mediumCounts } = data;
			generate(startGen, numGens, mediumCounts);
			break;
		default:
			console.error(`Unknown message type: ${type}`);
	}
};

function initCellBands(cells) {
	// Assume that the array of cells is called "cells"
	const topmostCells = cells.reduce((acc, cell) => {
		// If the current cell's color is not in the accumulator object, add it with the current cell as the topmost cell
		if (!acc[cell.medium]) {
			acc[cell.medium] = cell;
		}
		// If the current cell's y-coordinate is higher than the topmost cell's y-coordinate for the current color, update the topmost cell
		else if (cell.boundingBox.minY < acc[cell.medium].boundingBox.minY) {
			acc[cell.medium] = cell;
		}
		return acc;
	}, {});

	const bottommostCells = cells.reduce((acc, cell) => {
		// If the current cell's color is not in the accumulator object, add it with the current cell as the topmost cell
		if (!acc[cell.medium]) {
			acc[cell.medium] = cell;
		}
		// If the current cell's y-coordinate is higher than the topmost cell's y-coordinate for the current color, update the topmost cell
		else if (cell.boundingBox.maxY > acc[cell.medium].boundingBox.maxY) {
			acc[cell.medium] = cell;
		}
		return acc;
	}, {});

	for (const [index, cell] of Object.entries(topmostCells)) {
		const damp = 10;
		// Set the topmost cell's state to 1
		cell.setCurrent(1, Math.floor(cell.boundingBox.minY / damp));
		aliveCellIndizes.add(cell.index);
		// Set the topmost cell's neighbors' state to 0
		for (const neighborIndex of cell.neighbors) {
			if (cells[neighborIndex].medium === cell.medium) {
				cells[neighborIndex].setCurrent(
					0,
					Math.floor(cell.boundingBox.minY / damp)
				);
				candidateCellIndizes.add(neighborIndex);
			}
		}
	}
}

function generate(startGen, numGens, mediumCounts) {
	/* console.log("worker mediumCounts:", mediumCounts); */
	// Loop through every generation
	// Generate the next generation of cells

	let newAliveCellIndizes = new Set([...aliveCellIndizes]);
	let newCandidateCellIndizes = new Set([...candidateCellIndizes]);

	for (let gen = startGen; gen < startGen + numGens; gen++) {
		// Filter and loop through all candidate cells (state[0] equals the previous generations index)
		for (let candidateCellIndex of candidateCellIndizes) {
			// Get the neighbors of the candidate cells
			for (const neighborIndex of cells[candidateCellIndex].neighbors) {
				// only inspect the neighbors that are not alive in the previous generation
				if (
					!cells[neighborIndex].isAlive(gen - 1) && // only inspect neighbors that are not alive in the previous generation
					cells[neighborIndex].medium === cells[candidateCellIndex].medium // only inspect neighbors that are in the same medium
				) {
					// Inspect the not-yet-alive neighbor of the candidate and set its current state if necessary
					inspectCandidate(
						cells[neighborIndex],
						gen,
						newCandidateCellIndizes,
						newAliveCellIndizes
					);
				}
			}
		}

		// Filter for cells that are alive in the previous gerneration and loop through all the cells where state[] includes the previous generation
		// Inspect the cells and set the current state accordingly
		for (let aliveCellIndex of aliveCellIndizes) {
			const aliveCell = cells[aliveCellIndex];
			let stateIndex = aliveCell.getPreviousStateIndex(gen);
			if (stateIndex + 1 < Cell.lifetime) {
				aliveCell.setCurrent(stateIndex + 1, gen);
				// set cellsData equivalent to cell. See Cell.js setCurrent, setColor
				cellsData[aliveCellIndex].state[stateIndex + 1] = gen;
				cellsData[aliveCellIndex].color[stateIndex + 1] =
					aliveCell.color[stateIndex + 1];
				// remove the cell from the candidateCells set if it is a candidate (previousStateIndex === 0)
				if (stateIndex === 0) {
					newCandidateCellIndizes.delete(aliveCellIndex);
				}
			} else {
				// remove the cell from the aliveCells array if it is dead
				newAliveCellIndizes.delete(aliveCellIndex);
			}
		}

		newAliveCellIndizes.forEach((aliveCellIndex) => {
			updatedCellIndizes.add(aliveCellIndex);
			batchCounter++;
		});

		// Send updates less frequently, based on a batch size
		if (batchCounter >= BATCH_SIZE) {
			updatedCellIndizes.forEach((updatedCellIndex) => {
				batchUpdates.push(cellsData[updatedCellIndex]);
			});
			postMessage({
				type: "updateCells",
				data: { batchUpdates: batchUpdates, gen: gen }
			});
			updatedCellIndizes.clear();
			batchUpdates = [];
			batchCounter = 0;
		}

		// Update the main sets
		aliveCellIndizes = newAliveCellIndizes;
		candidateCellIndizes = newCandidateCellIndizes;
	}
}

function inspectCandidate(
	candidate,
	gen,
	newCandidateCellIndizes,
	newAliveCellIndizes
) {
	let sumNeighbors = 0;

	for (const neighborIndex of candidate.neighbors) {
		// skip all neighbors that are not alive in the previous generation
		if (
			cells[neighborIndex].isAlive(gen - 1) /* &&
			cells[neighborIndex].medium === candidate.medium */
		) {
			sumNeighbors += 1;
		}
	}

	if (sumNeighbors >= Cell.threshold) {
		candidate.setCurrent(0, gen);
		newCandidateCellIndizes.add(candidate.getIndex());
		newAliveCellIndizes.add(candidate.getIndex());
		// set cellsData equivalent to cell. See Cell.js setCurrent, setColor
		cellsData[candidate.getIndex()].state[0] = gen;
		cellsData[candidate.getIndex()].color[0] = candidate.color[0];
	}
}

export {};
