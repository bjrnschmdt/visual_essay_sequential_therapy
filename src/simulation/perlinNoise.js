// https://observablehq.com/@mbostock/perlin-noise@283

import { shuffle } from "d3";

const P = new Uint8Array(256);
for (let i = 0; i < 256; ++i) P[i] = i;
shuffle(P);

const p = new Uint8Array(512);
for (let i = 0; i < 256; ++i) p[i] = p[i + 256] = P[i];

export function perlin3(x, y, z) {
	const xi = Math.floor(x),
		yi = Math.floor(y),
		zi = Math.floor(z);
	const X = xi & 255,
		Y = yi & 255,
		Z = zi & 255;
	const u = fade((x -= xi)),
		v = fade((y -= yi)),
		w = fade((z -= zi));
	const A = p[X] + Y,
		AA = p[A] + Z,
		AB = p[A + 1] + Z;
	const B = p[X + 1] + Y,
		BA = p[B] + Z,
		BB = p[B + 1] + Z;
	return lerp(
		w,
		lerp(
			v,
			lerp(u, grad3(p[AA], x, y, z), grad3(p[BA], x - 1, y, z)),
			lerp(u, grad3(p[AB], x, y - 1, z), grad3(p[BB], x - 1, y - 1, z))
		),
		lerp(
			v,
			lerp(u, grad3(p[AA + 1], x, y, z - 1), grad3(p[BA + 1], x - 1, y, z - 1)),
			lerp(
				u,
				grad3(p[AB + 1], x, y - 1, z - 1),
				grad3(p[BB + 1], x - 1, y - 1, z - 1)
			)
		)
	);
}

export function perlin2(x, y) {
	const xi = Math.floor(x),
		yi = Math.floor(y);
	const X = xi & 255,
		Y = yi & 255;
	const u = fade((x -= xi)),
		v = fade((y -= yi));
	const A = p[X] + Y,
		B = p[X + 1] + Y;
	return lerp(
		v,
		lerp(u, grad2(p[A], x, y), grad2(p[B], x - 1, y)),
		lerp(u, grad2(p[A + 1], x, y - 1), grad2(p[B + 1], x - 1, y - 1))
	);
}

export function octave(noise, octaves) {
	return function (x, y, z) {
		let total = 0;
		let frequency = 1;
		let amplitude = 1;
		let value = 0;
		for (let i = 0; i < octaves; ++i) {
			value += noise(x * frequency, y * frequency, z * frequency) * amplitude;
			total += amplitude;
			amplitude *= 0.5;
			frequency *= 2;
		}
		return value / total;
	};
}

function grad3(i, x, y, z) {
	const h = i & 15;
	const u = h < 8 ? x : y;
	const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
	return (h & 1 ? -u : u) + (h & 2 ? -v : v);
}

function grad2(i, x, y) {
	const v = i & 1 ? y : x;
	return i & 2 ? -v : v;
}

function fade(t) {
	return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t, a, b) {
	return a + t * (b - a);
}
