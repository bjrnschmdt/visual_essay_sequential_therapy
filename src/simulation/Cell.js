import { octave, perlin2 } from "./../simulation/perlinNoise";
import { scaleLinear, rgb } from "d3";

const octaves = 5;
const noise = octave(perlin2, octaves);

var normalizeRgb = scaleLinear().domain([0, 255]).range([0, 1]);

var mapNoise2Rgb = scaleLinear().domain([-1, 1]).range([0, 255]);

multiplyRgb = (a, b, factor) => {
	let r = 255 * normalizeRgb(b.r * factor) * normalizeRgb(a.r);
	let g = 255 * normalizeRgb(b.g * factor) * normalizeRgb(a.g);
	let b = 255 * normalizeRgb(b.b * factor) * normalizeRgb(a.b);
	return rgb(r, g, b);
};

export default class Cell {
	static r = 1;
	static N0 = 1.0;
	static lifetime = 255.0;

	constructor(x_, y_, index, numGenerations) {
		this.x = x_;
		this.y = y_;
		this.numGenerations = numGenerations;
		this.state = new Array(this.numGenerations);
		this.color = new Array(this.numGenerations);
		this.index = index;
		this.noiseBaseScale = 0.001;
		this.noiseBactScale = 0.01;
		this.colorBase = rgb(100, 100, 100);
		this.colorBact = rgb("dimgrey");
		this.init();
	}

	init = () => {
		this.baseScale = scaleLinear().domain([-1, 1]).range([0, 100]);
		for (let i = 0; i < this.numGenerations; i++) {
			this.state[i] = 0;
			this.color[i] = this.setBaseColor();
		}
	};

	getPos = () => {
		return [this.x, this.y];
	};

	getColor = (gen) => {
		// population dynamic function
		return (
			1 /
			((1 / Cell.N0 - 1 / Cell.lifetime) * Math.exp(-Cell.r * this.state[gen]) +
				1 / Cell.lifetime)
		);
	};

	setColorBase = () => {
		let perlin = noise(
			this.x * this.noiseBaseScale,
			this.y * this.noiseBaseScale
		);
		let p = rgb(perlin, perlin, perlin);
		multiply(this.colorBase, p);
		return;
	};

	setColor = (gen) => {};

	getIndex = () => {
		return this.index;
	};

	getPrevious = (i) => {
		return this.state[i - 1];
	};

	getCurrent = (i) => {
		return this.state[i];
	};

	setCurrent = (i, s) => {
		this.state[i] = s;
	};
}

normalizeRgb = (a) => {};
