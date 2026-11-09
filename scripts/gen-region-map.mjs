// One-off generator for apps/webstack/src/lib/regionMap.ts
//   node scripts/gen-region-map.mjs <HangJeongDong_ver*.geojson> > apps/webstack/src/lib/regionMap.ts
// Source: vuski/admdongkor ver20261001 (dong level, already has 전남광주통합특별시 and 2026 city changes).
// Dongs are dissolved into cities/districts and into role regions with mapshaper (shared simplified arcs,
// so city borders and region borders line up). Seoul/Gyeonggi are split into 3 role regions each.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const MAPSHAPER = 'mapshaper@0.7.101';
const SIMPLIFY = '3%';

const SEOUL = {
	'서울 서북부': '강서구 은평구 영등포구 마포구 양천구 구로구 서대문구 금천구',
	'서울 동북부': '노원구 성북구 광진구 동대문구 중랑구 성동구 도봉구 강북구 용산구 종로구 중구',
	'서울 동남부': '관악구 송파구 강남구 강동구 동작구 서초구'
};
const GG = {
	'경기 북부':
		'고양시 남양주시 파주시 의정부시 김포시 하남시 양주시 구리시 포천시 양평군 동두천시 가평군 연천군',
	'경기 서남부': '수원시 부천시 안산시 안양시 시흥시 광명시 군포시 의왕시 과천시',
	'경기 동남부': '용인시 화성시 성남시 평택시 광주시 오산시 이천시 안성시 여주시'
};
const MEMBERS = { ...SEOUL, ...GG };
const lookup = (tbl, name) => {
	for (const [r, list] of Object.entries(tbl)) if (list.split(' ').includes(name)) return r;
	throw new Error('unmapped ' + name);
};

// "수원시장안구" -> "수원시" (districts of a city are merged into the city); metro 구 stay as is.
const muniName = (sggnm) => sggnm.match(/^(.+?시)(.+구)$/)?.[1] ?? sggnm;
const regionOf = ({ sidonm, sggnm }, muni) =>
	sidonm.startsWith('서울') ? lookup(SEOUL, muni) : sidonm.startsWith('경기') ? lookup(GG, muni) : sidonm;

// --- 1. annotate dongs with region (r), muni key (m), muni label (l)
const src = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const dir = mkdtempSync(join(tmpdir(), 'regionmap-'));
for (const f of src.features) {
	const p = f.properties;
	const l = muniName(p.sggnm);
	f.properties = { r: regionOf(p, l), m: p.sidonm + '/' + l, l };
}
writeFileSync(join(dir, 'in.json'), JSON.stringify(src));
// MAPSHAPER_BIN: path to an already-installed mapshaper; otherwise fetched via npx.
const ms = (...args) =>
	process.env.MAPSHAPER_BIN
		? execFileSync(process.env.MAPSHAPER_BIN, args, { stdio: 'inherit' })
		: execFileSync('npx', ['-y', MAPSHAPER, ...args], { stdio: 'inherit' });
ms(join(dir, 'in.json'), '-simplify', SIMPLIFY, 'keep-shapes', '-dissolve', 'm', 'copy-fields=r,l', '-o', join(dir, 'muni.json'), 'format=geojson');
ms(join(dir, 'in.json'), '-simplify', SIMPLIFY, 'keep-shapes', '-dissolve', 'r', '-o', join(dir, 'region.json'), 'format=geojson');

// --- 2. project + build SVG paths
const K = 100;
const C = Math.cos((36 * Math.PI) / 180);
const proj = ([lon, lat]) => [(lon - 124.5) * C * K, (38.7 - lat) * K];
const ringArea = (r) =>
	Math.abs(
		r.reduce((s, p, i) => {
			const q = r[i - 1] ?? r.at(-1);
			return s + q[0] * p[1] - p[0] * q[1];
		}, 0) / 2
	);
const bboxOf = (r) => {
	const xs = r.map((p) => p[0]);
	const ys = r.map((p) => p[1]);
	return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};
const centroid = (r) => {
	let a = 0;
	let cx = 0;
	let cy = 0;
	r.forEach((p, i) => {
		const q = r[i - 1] ?? r.at(-1);
		const c = q[0] * p[1] - p[0] * q[1];
		a += c;
		cx += (q[0] + p[0]) * c;
		cy += (q[1] + p[1]) * c;
	});
	return [cx / (3 * a), cy / (3 * a)];
};
const r1 = (n) => Math.round(n * 10) / 10;

// feature -> { d, main: bbox/centroid of largest outer ring (ignores far islands) }
function shape(f) {
	const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
	let d = '';
	let main = null;
	const biggest = Math.max(...polys.map((p) => ringArea(p[0].map(proj))));
	for (const poly of polys) {
		const rings = poly.map((ring) => ring.map(proj));
		if (ringArea(rings[0]) < Math.min(3, biggest)) continue; // tiny islet
		for (const r of rings) d += 'M' + r.map((p) => r1(p[0]) + ' ' + r1(p[1])).join('L') + 'Z';
		const a = ringArea(rings[0]);
		if (!main || a > main.a) main = { a, ring: rings[0] };
	}
	return { d, main };
}
const read = (n) => JSON.parse(readFileSync(join(dir, n), 'utf8')).features;

const regionPaths = read('region.json').map((f) => {
	const { d, main } = shape(f);
	// bbox over rings that are not tiny compared to the biggest (so far islands don't skew centering/fit)
	const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
	const outers = polys.map((p) => p[0].map(proj)).filter((r) => ringArea(r) >= main.a * 0.25);
	const bs = outers.map(bboxOf);
	const bbox = [
		Math.min(...bs.map((b) => b[0])),
		Math.min(...bs.map((b) => b[1])),
		Math.max(...bs.map((b) => b[2])),
		Math.max(...bs.map((b) => b[3]))
	].map(r1);
	const [x, y] = centroid(main.ring);
	const mb = bboxOf(main.ring);
	return { name: f.properties.r, d, bbox, c: [r1(x), r1(y)], w: r1(mb[2] - mb[0]) };
});
const muniPaths = read('muni.json').map((f) => {
	const { d, main } = shape(f);
	const [x, y] = centroid(main.ring);
	const mb = bboxOf(main.ring);
	return { region: f.properties.r, name: f.properties.l, d, c: [r1(x), r1(y)], w: r1(mb[2] - mb[0]) };
});

const json = (v) => JSON.stringify(v);
const members = Object.fromEntries(Object.entries(MEMBERS).map(([k, v]) => [k, v.split(' ')]));
console.log('// Generated by scripts/gen-region-map.mjs. Do not edit.');
console.log('// bbox: [x0,y0,x1,y1]; c: label point; w: width of main ring (for label fit checks).');
console.log('export const REGION_MAP_VIEWBOX = "0 0 530 560";');
console.log(
	'export const regionPaths: { name: string; d: string; bbox: number[]; c: number[]; w: number }[] = ' +
		json(regionPaths) +
		';'
);
console.log(
	'export const muniPaths: { region: string; name: string; d: string; c: number[]; w: number }[] = ' +
		json(muniPaths) +
		';'
);
console.log('export const regionMembers: Record<string, string[]> = ' + json(members) + ';');
