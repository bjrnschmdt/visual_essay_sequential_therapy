import { octave, perlin2 } from "./../simulation/perlinNoise";
import { scaleLinear, rgb, interpolateRgb, easePolyInOut } from "d3";

const octaves = 5;
const noise = octave(perlin2, octaves);

function multiplyRgb(c1, c2, factor) {
	  // Apply the "multiply" blend mode formula to each color channel
	  const r = Math.round(c1.r * c2.r / 255 * factor);
	  const g = Math.round(c1.g * c2.g / 255 * factor);
	  const b = Math.round(c1.b * c2.b / 255 * factor);
	  return rgb(r, g, b);
}

function calcNoise(x, y, noiseScale) {
	let perlinNorm = noise(
		x * noiseScale,
		y * noiseScale * 0.5
	);
	let perlinRgb = Math.round(mapNoise2Rgb(perlinNorm));
	let perlin = rgb(perlinRgb, perlinRgb, perlinRgb);
	return perlin;
}

export default class Cell {
	static r = 1; 																				// Growthrate
	static lifetime = 32; 																		// Scope of growth, influences tempo of growth
	static growthExponent = 4; 																	// Slope of growth, influences shape of growth

	constructor(x_, y_, index) {
		this.x = x_;
		this.y = y_;
		this.index = index;													
		this.state = new Array(Cell.lifetime);													// State of the cell per step in lifetime
		this.color = new Array(Cell.lifetime);													// Color of the cell per step in lifetime
		this.noiseBaseScale = 0.001;															// Scale of the perlin noise of the antibiotic medium
		this.noiseBactScale = 0.008;															// Scale of the perlin noise of the bacteria
		this.noiseBaseFactor = 0.5;																// Factor of the perlin noise of the antibiotic medium
		this.noiseBactFactor = 0.9;																// Factor of the perlin noise of the bacteria
		this.noiseBase = calcNoise(this.x, this.y, this.noiseBaseScale); 						// Perlin noise of the antibiotic medium
		this.noiseBact = calcNoise(this.x, this.y, this.noiseBactScale); 						// Perlin noise of the bacteria
		this.colorBase = rgb(105, 105, 105);													// Initial color of the antibiotic medium
		this.colorBact = rgb(255, 0, 0); 														// Initial color of the bacteria
		this.colorBaseComp = multiplyRgb(this.colorBase, this.noiseBase, this.noiseBaseFactor); // Composite color of the antibiotic medium and the perlin noise
		this.colorBactComp = multiplyRgb(this.colorBact, this.noiseBact, this.noiseBactFactor); // Composite color of the bacteria and the perlin noise
		this.init();
	}

	init = () => {
		for (let i = 0; i < Cell.lifetime; i++) {
			this.setColor(i);
		}
	};

	getPos = () => {
		return [this.x, this.y];
	};

	getColor = (i) => {
		return this.color[i];
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
	}
}

var normalizeState = scaleLinear().domain([0, Cell.lifetime]).range([0, 1]);
var mapNoise2Rgb = scaleLinear().domain([-1, 1]).range([0, 255]);