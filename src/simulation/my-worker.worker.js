// my-worker.worker.js

import Cell from "./Cell";

let cells = [];
let cellsData = [];

onmessage = (event) => {
	const { type, data } = event.data;

	switch (type) {
		case "addCell":
			const { x, y, index, polygon, neighbors } = data;
			cells.push(new Cell(x, y, index, polygon, neighbors));
			cellsData.push({
				index: index,
				boundingBox: cells[index].getBoundingBox(),
				color: cells[index].color,
				state: cells[index].state
			});
			break;
		case "initCell":
			const { startIndex } = data;
			cells[startIndex].setCurrent(1, 0);
			console.log(cells[startIndex], cellsData[startIndex]);
			for (const neighbor of cells[startIndex].neighbors) {
				cells[neighbor].setCurrent(0, 0);
			}
			break;
		case "generate":
			const { startGen, numGens } = data;
			generate(startGen, numGens);
			break;
		default:
			console.error(`Unknown message type: ${type}`);
	}
};

function generate(startGen, numGens) {
	// Loop through every generation
	// Generate the next generation of cells
	//console.log("startGen: " + startGen);

	for (let gen = startGen; gen < startGen + numGens; gen++) {
		// Filter and loop through all cells that where state[0] equals the previous generations index
		cells
			.filter((cell) => cell.getState(0) == gen - 1)
			.forEach((cell) => {
				// Get the neighbors of the cells
				for (const neighbor of cell.neighbors) {
					// only inspect the neighbors that are not alive in the previous generation
					if (!cells[neighbor].isAlive(gen - 1)) {
						// Inspect the candidate and set its current state if necessary
						inspectCandidate(cells[neighbor], gen);
					}
				}
			});

		// Filter for cells that are alive in the previous gerneration and loop through all the cells where state[] includes the previous generation
		// Inspect the cells and set the current state accordingly
		cells
			.filter((cell) => cell.isAlive(gen - 1))
			.forEach((cell) => {
				let index = cell.getPreviousStateIndex(gen);
				if (index + 1 < Cell.lifetime) {
					cell.setCurrent(index + 1, gen);
					// set cellsData equivalent to cell. See Cell.js setCurrent, setColor
					cellsData[cell.getIndex()].state[index + 1] = gen;
					cellsData[cell.getIndex()].color[index + 1] = cell.color[index + 1];
				}
			});

		postMessage({
			type: "updateCells",
			data: { cellsData }
		});
	}
}

function inspectCandidate(candidate, gen) {
	let sumNeighbors = 0;

	for (const neighbor of candidate.neighbors) {
		// skip all neighbors that are not alive in the previous generation
		if (cells[neighbor].isAlive(gen - 1)) {
			sumNeighbors += 1;
		}
	}

	if (sumNeighbors >= Cell.threshold) {
		candidate.setCurrent(0, gen);
		// set cellsData equivalent to cell. See Cell.js setCurrent, setColor
		cellsData[candidate.getIndex()].state[0] = gen;
		cellsData[candidate.getIndex()].color[0] = candidate.color[0];
	}
}

export {};
