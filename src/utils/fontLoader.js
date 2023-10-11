let WebFont;

async function initializeWebFontLoader() {
	if (!WebFont && typeof window !== "undefined") {
		const module = await import("webfontloader");
		WebFont = module.default;
	}
}

export async function loadFonts(callback, afterBoundingBoxCallback) {
	await initializeWebFontLoader();

	return new Promise((resolve, reject) => {
		if (!WebFont) {
			reject(new Error("WebFont not initialized"));
			return;
		}

		WebFont.load({
			google: {
				families: ["Golos Text:400,700", "Share Tech Mono"] // Replace with the font families you're using
			},
			active: () => {
				if (callback) callback();
				if (afterBoundingBoxCallback) afterBoundingBoxCallback();
				resolve();
			},
			inactive: () => {
				reject(new Error("Some or all fonts could not be loaded"));
			}
		});
	});
}
