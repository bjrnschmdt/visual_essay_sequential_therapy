export default class Cell {
	static r = 0.1;
	static N0 = 1.0;
	static lifetime = 255.0;
	constructor(x_, y_, state_) {
		this.x = x_;
		this.y = y_;
		this.state = state_;
		this.counter = 0;
	}

	savePrevious = function () {
		this.previous = this.counter;
	};

	newState = function (s) {
		this.counter = s;
		// population dynamic function
		this.state =
			1 / ((1 / N0 - 1 / lifetime) * Math.exp(-r * counter) + 1 / lifetime);
	};
}
