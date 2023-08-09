import { octave, perlin2 } from "./../simulation/perlinNoise";
import { scaleLinear, rgb, interpolateRgb, easePolyInOut } from "d3";

const octaves = 5;
const noise = octave(perlin2, octaves);

function multiplyRgb(c1, c2, factor) {
	// Apply the "multiply" blend mode formula to each color channel
	const r = Math.round(((c1.r * c2.r) / 255) * factor);
	const g = Math.round(((c1.g * c2.g) / 255) * factor);
	const b = Math.round(((c1.b * c2.b) / 255) * factor);
	return rgb(r, g, b);
}

function calcNoise(x, y, noiseScale) {
	let perlinNorm = noise(x * noiseScale, y * noiseScale * 0.5);
	let perlinRgb = Math.round(mapNoise2Rgb(perlinNorm));
	let perlin = rgb(perlinRgb, perlinRgb, perlinRgb);
	return perlin;
}

export default class Cell {
	static r = 1; // Growthrate
	static lifetime = 32; // Scope of growth, influences tempo of growth
	static growthExponent = 4; // Slope of growth, influences shape of growth
	static threshold = 2; // Threshold for growth

	constructor(x_, y_, index, polygon_, neighbors_) {
		this.x = x_;
		this.y = y_;
		this.index = index;
		this.polygon = polygon_;
		this.neighbors = neighbors_;
		this.state = []; // State of the cell per step in lifetime
		this.color = []; // Color of the cell per step in lifetime
		this.noiseBaseScale = 0.001; // Scale of the perlin noise of the antibiotic medium
		this.noiseBactScale = 0.008; // Scale of the perlin noise of the bacteria
		this.noiseBaseFactor = 0.5; // Factor of the perlin noise of the antibiotic medium
		this.noiseBactFactor = 0.9; // Factor of the perlin noise of the bacteria
		this.noiseBase = calcNoise(this.x, this.y, this.noiseBaseScale); // Perlin noise of the antibiotic medium
		this.noiseBact = calcNoise(this.x, this.y, this.noiseBactScale); // Perlin noise of the bacteria
		this.colorBase = rgb(105, 105, 105); // Initial color of the antibiotic medium
		this.colorBact = rgb(255, 0, 0); // Initial color of the bacteria
		this.colorBaseComp = multiplyRgb(
			this.colorBase,
			this.noiseBase,
			this.noiseBaseFactor
		); // Composite color of the antibiotic medium and the perlin noise
		this.colorBactComp = multiplyRgb(
			this.colorBact,
			this.noiseBact,
			this.noiseBactFactor
		); // Composite color of the bacteria and the perlin noise
		this.boundingBox = null;
		this.init();
	}

	init = () => {
		for (let i = 0; i < Cell.lifetime; i++) {
			this.setColor(i);
		}
		this.boundingBox = this.computeBoundingBox();
	};

	getPos = () => {
		return [this.x, this.y];
	};

	// Add a new method to extract the bounding box of the cell
	computeBoundingBox = () => {
		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;

		for (let i = 0; i < this.polygon.length; i++) {
			minX = Math.min(minX, this.polygon[i][0]);
			minY = Math.min(minY, this.polygon[i][1]);
			maxX = Math.max(maxX, this.polygon[i][0]);
			maxY = Math.max(maxY, this.polygon[i][1]);
		}

		return { minX, minY, maxX, maxY };
	};

	getBoundingBox = () => {
		return this.boundingBox;
	};

	/* getColor = (i) => {
		return this.color[i];
	}; */

	getColor = (gen) => {
		return this.isAlive(gen)
			? this.color[this.getCurrentStateIndex(gen)]
			: this.isDead(gen)
			? this.color[Cell.lifetime - 1]
			: this.color[0];
	};

	setColor = (i) => {
		const customPolyInOut = easePolyInOut.exponent(Cell.growthExponent);
		let factor = customPolyInOut(normalizeState(i));
		const interpolator = interpolateRgb(this.colorBaseComp, this.colorBactComp);
		this.color[i] = interpolator(factor);
	};

	getIndex = () => {
		return this.index;
	};

	getPrevious = (i) => {
		return this.state[i - 1];
	};

	getCurrent = (i) => {
		return this.state[i];
	};

	getState = (i) => {
		return this.state[i];
	};

	getPreviousStateIndex = (gen) => {
		return this.state.indexOf(gen - 1);
	};

	getCurrentStateIndex = (gen) => {
		return this.state.indexOf(gen);
	};

	setCurrent = (i, gen) => {
		this.state[i] = gen;
		this.setColor(i);
	};

	isAlive = (gen) => {
		return this.state.includes(gen);
	};

	isDead = (gen) => {
		return !this.isAlive(gen) && gen > this.state.slice(-1);
	};
}

var normalizeState = scaleLinear().domain([0, Cell.lifetime]).range([0, 1]);
var mapNoise2Rgb = scaleLinear().domain([-1, 1]).range([0, 255]);
