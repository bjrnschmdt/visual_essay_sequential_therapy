export default class Cell {
	static r = 1;
	static N0 = 1.0;
	static lifetime = 255.0;
	constructor(x_, y_, index, numGenerations) {
		this.x = x_;
		this.y = y_;
		this.numGenerations = numGenerations;
		this.state = new Array(this.numGenerations);
		this.index = index;
		this.init();
	}

	init() {
		for (let i = 0; i < this.numGenerations; i++) {
			this.state[i] = 0;
		}
	}

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
