// Renders public/og.png, the preview image Discord and other sites show for links.
// Run with `node scripts/og-image.mjs` after changing the branding.
//
// The SVG is drawn by sharp (librsvg), which only sees fonts known to fontconfig,
// so the brand fonts are downloaded to a temp folder and handed over through
// FONTCONFIG_FILE before sharp loads.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const fontDir = join(tmpdir(), 'miru-og-fonts');
await mkdir(fontDir, { recursive: true });

// Without a browser user agent, Google Fonts serves whole TTF files.
const css = await fetch(
	'https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@900&family=Figtree:wght@500;700&family=JetBrains+Mono:wght@500',
).then((res) => res.text());
const urls = [...css.matchAll(/url\((https:[^)]+\.ttf)\)/g)].map((m) => m[1]);
await Promise.all(
	urls.map(async (url, i) => {
		const data = Buffer.from(await fetch(url).then((res) => res.arrayBuffer()));
		await writeFile(join(fontDir, `${i}.ttf`), data);
	}),
);
const conf = join(fontDir, 'fonts.conf');
await writeFile(conf, `<?xml version="1.0"?><fontconfig><dir>${fontDir}</dir><cachedir>${fontDir}/cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = conf;

const { default: sharp } = await import('sharp');

const logo = (await readFile(join(root, 'public/android-chrome-512x512.png'))).toString('base64');

const petal = 'M10 1c4 3 7 7 6 11s-4 7-6 7-5-3-6-7 2-8 6-11Z';
const petals = [
	[1010, 70, 2.2, 24, 0.7],
	[1120, 250, 1.4, -30, 0.5],
	[860, 520, 1.8, 60, 0.6],
	[640, 70, 1.2, -12, 0.45],
	[560, 560, 1.5, 40, 0.5],
	[1140, 520, 2.4, -50, 0.65],
	[60, 560, 1.3, 15, 0.4],
	[720, 300, 1, 80, 0.35],
]
	.map(([x, y, s, r, o]) => `<path d="${petal}" fill="#ffb7cf" opacity="${o}" transform="translate(${x} ${y}) rotate(${r}) scale(${s})"/>`)
	.join('');

const chips = ['/anime', '/trace', '/alerts', '/wrapped'];
let chipX = 80;
const chipSvg = chips
	.map((label) => {
		const w = 32 + label.length * 15;
		const svg = `<g transform="translate(${chipX} 470)"><rect width="${w}" height="48" rx="24" fill="#ffffff" stroke="#f3dbe3" stroke-width="2"/><text x="${w / 2}" y="31" text-anchor="middle" font-family="JetBrains Mono" font-weight="500" font-size="22" fill="#d6417f">${label}</text></g>`;
		chipX += w + 12;
		return svg;
	})
	.join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
	<defs>
		<radialGradient id="pink" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffd3e3"/><stop offset="1" stop-color="#ffd3e3" stop-opacity="0"/></radialGradient>
		<radialGradient id="lav" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#c9b8ff" stop-opacity="0.45"/><stop offset="1" stop-color="#c9b8ff" stop-opacity="0"/></radialGradient>
		<filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#782850" flood-opacity="0.22"/></filter>
		<clipPath id="tile"><rect width="300" height="300" rx="72"/></clipPath>
	</defs>
	<rect width="1200" height="630" fill="#fff8f6"/>
	<circle cx="960" cy="260" r="420" fill="url(#pink)"/>
	<circle cx="120" cy="640" r="360" fill="url(#lav)"/>
	<text x="1230" y="660" text-anchor="end" font-family="Zen Maru Gothic" font-weight="900" font-size="400" fill="#ec5f9a" opacity="0.08">見る</text>
	${petals}
	<g transform="translate(830 150) rotate(-6 150 150)" filter="url(#shadow)">
		<rect width="300" height="300" rx="72" fill="#ffffff"/>
		<image width="300" height="300" clip-path="url(#tile)" xlink:href="data:image/png;base64,${logo}"/>
	</g>
	<text x="80" y="128" font-family="JetBrains Mono" font-weight="500" font-size="22" letter-spacing="3" fill="#ec5f9a">ANIME &amp; MANGA ON DISCORD</text>
	<text x="74" y="262" font-family="Zen Maru Gothic" font-weight="900" font-size="150" fill="#3a2533">Miru</text>
	<text font-family="Figtree" font-weight="500" font-size="34" fill="#6e5363">
		<tspan x="80" y="340">Search any show, find a scene from a</tspan>
		<tspan x="80" y="386">screenshot and track your AniList.</tspan>
	</text>
	${chipSvg}
	<rect y="618" width="1200" height="12" fill="#ec5f9a"/>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(join(root, 'public/og.png'));
console.log('Wrote public/og.png');
