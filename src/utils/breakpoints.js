let breakpointValue = null;
const slope = -0.00145;
const intercept = 13.6;
const offsetSM = -0.25;

const regression = (x, offset = 0) => {
	return slope * x + (intercept + offset);
};

const HORIZONTAL_BREAKPOINTS = {
	XS: 576,
	SM: 768,
	MD: 992,
	LG: 1200,
	XL: 1400
};

const VERTICAL_BREAKPOINTS = {
	XS: 600,
	SM: 800,
	MD: 1024
};

const breakpointValues = {
	XS: {
		XS: {
			key: "XS-XS",
			width: 576,
			height: 600,
			/* value: regression(576) */
			value: 13.6
		},
		SM: {
			key: "XS-SM",
			width: 576,
			height: 800,
			value: regression(576, offsetSM)
		},
		MD: {
			key: "XS-MD",
			width: 576,
			height: 1024,
			value: regression(576)
		}
		// ... other vertical breakpoints
	},
	SM: {
		XS: {
			key: "SM-XS",
			width: 768,
			height: 600,
			value: regression(768)
		},
		SM: {
			key: "SM-SM",
			width: 768,
			height: 800,
			value: regression(768, offsetSM)
		},
		MD: {
			key: "SM-MD",
			width: 768,
			height: 1024,
			value: regression(768)
		}
		// ... other vertical breakpoints
	},
	MD: {
		XS: {
			key: "MD-XS",
			width: 992,
			height: 600,
			value: regression(992)
		},
		SM: {
			key: "MD-SM",
			width: 992,
			height: 800,
			value: regression(992, offsetSM)
		},
		MD: {
			key: "MD-MD",
			width: 992,
			height: 1024,
			value: regression(992)
		}
		// ... other vertical breakpoints
	},
	LG: {
		XS: {
			key: "LG-XS",
			width: 1200,
			height: 600,
			value: regression(1200)
		},
		SM: {
			key: "LG-SM",
			width: 1200,
			height: 800,
			value: regression(1200, offsetSM)
		},
		MD: {
			key: "LG-MD",
			width: 1200,
			height: 1024,
			value: regression(1200)
		}
		// ... other vertical breakpoints
	},
	XL: {
		XS: {
			key: "XL-XS",
			width: 1400,
			height: 600,
			value: regression(1400)
		},
		SM: {
			key: "XL-SM",
			width: 1400,
			height: 800,
			value: regression(1400, offsetSM)
		},
		MD: {
			key: "XL-MD",
			width: 1400,
			height: 1024,
			value: regression(1400)
		}
		// ... other vertical breakpoints
	}
	// ... other horizontal breakpoints
};

export function detectBreakpoints() {
	const width = window.innerWidth;
	const height = window.innerHeight;

	let horizontalBreakpoint;
	let verticalBreakpoint;

	// Detect horizontal breakpoint
	if (width <= HORIZONTAL_BREAKPOINTS.XS) {
		horizontalBreakpoint = "XS";
	} else if (width <= HORIZONTAL_BREAKPOINTS.SM) {
		horizontalBreakpoint = "SM";
	} else if (width <= HORIZONTAL_BREAKPOINTS.MD) {
		horizontalBreakpoint = "MD";
	} else if (width <= HORIZONTAL_BREAKPOINTS.LG) {
		horizontalBreakpoint = "LG";
	} else {
		horizontalBreakpoint = "XL";
	}

	// Detect vertical breakpoint
	if (height <= VERTICAL_BREAKPOINTS.XS) {
		verticalBreakpoint = "XS";
	} else if (height <= VERTICAL_BREAKPOINTS.SM) {
		verticalBreakpoint = "SM";
	} else {
		verticalBreakpoint = "MD";
	}

	// Call a function based on the combination
	handleBreakpointCombination(horizontalBreakpoint, verticalBreakpoint);
}

function handleBreakpointCombination(horizontal, vertical) {
	breakpointValue = breakpointValues[horizontal][vertical];
}

export function getBreakpointValue() {
	return breakpointValue;
}
