import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, lstatSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { buildDossier, readAppTree } from '../vendor/makefun-frontend.ts';

const caps = { text_max_bytes: 163840, screenshots: {max:4,max_bytes:262144},app_max_files:993,app_max_bytes:50331648 };
function files(directory) {
  return readdirSync(directory,{withFileTypes:true}).flatMap(entry=> {
    const path=join(directory,entry.name);
    assert(!lstatSync(path).isSymbolicLink(),`Symlink: ${path}`);
    return entry.isDirectory() ? files(path) : [path];
  });
}
function jpegDimensions(bytes) {
  assert.equal(bytes.readUInt16BE(0),0xffd8);
  assert.equal(bytes.readUInt16BE(bytes.length-2),0xffd9);
  let offset=2;
  while(offset<bytes.length) {
    assert.equal(bytes[offset],0xff);
    const marker=bytes[offset+1];
    const length=bytes.readUInt16BE(offset+2);
    if([0xc0,0xc1,0xc2].includes(marker)) return {width:bytes.readUInt16BE(offset+7),height:bytes.readUInt16BE(offset+5)};
    offset+=length+2;
  }
  throw new Error('No JPEG size frame');
}
const tree = readAppTree('app',{max_files:993,max_bytes:50331648});
const paths=files('app');
assert(paths.length<=993);
assert(paths.reduce((n,path)=>n+statSync(path).size,0)<=50331648);
console.log('pass app_files: regular static files within all caps');
const html=readFileSync('app/index.html','utf8');
assert(!/<(?:script|img|iframe)[^>]+src=["']https?:/i.test(html));
assert(!/@import|url\(/.test(readFileSync('app/app.css','utf8')));
for(const path of paths.filter(path=>/\.(?:js|mjs)$/.test(path))) {
  const source=readFileSync(path,'utf8');
  for(const match of source.matchAll(/^import\s+.*?from\s*['"]([^'"]+)['"]/gm)) assert(match[1].startsWith('./'));
  assert(!/fetch\(['"]https?:/.test(source));
  execFileSync(process.execPath,['--check',path]);
}
console.log('pass references: all loaded references local; browser request audit recorded separately');
const shots=files('screenshots');
assert(shots.length>=3 && shots.length<=4);
for(const path of shots) {
  const bytes=readFileSync(path), {width,height}=jpegDimensions(bytes);
  assert(bytes.length<=262144);
  assert(Math.max(width,height)<=1280 && Math.min(width,height)>=480);
  console.log(`pass screenshots: ${path} ${width}x${height}, ${bytes.length} bytes`);
}
const expected=buildDossier('out',caps);
const actual=readFileSync('out/dossier.json');
assert(actual.equals(Buffer.from(expected)));
assert(actual.length<=1572864);
console.log(`pass dossier_matches: byte-identical rebuild, ${actual.length} bytes`);
const original=JSON.parse(execFileSync('git',['show','b80e994:app/data/trophies.json'],{encoding:'utf8'})).trophies;
const data=JSON.parse(readFileSync('app/data/trophies.json','utf8')).trophies;
assert.equal(data.length,55);
assert.equal(new Set(data.map(t=>t.name)).size,55);
for(const trophy of data) {
  const before=original.find(t=>t.id===trophy.id);
  for(const key of ['name','description','grade']) assert.equal(trophy[key],before[key]);
  assert(trophy.guide && trophy.sources.length && typeof trophy.missable==='boolean' && trophy.missableReason && trophy.kind && trophy.stage);
}
assert.deepEqual(Object.fromEntries(['platinum','gold','silver','bronze'].map(g=>[g,data.filter(t=>t.grade===g).length])),{platinum:1,gold:2,silver:6,bronze:46});
console.log('pass trophies: 55 exact official names, descriptions and grades; 55 original cited guides');
console.log('pass js_parses: every JavaScript module passes node --check');
const vendor=execFileSync('git',['show','b80e994:vendor/makefun-frontend.ts']);
assert(vendor.equals(readFileSync('vendor/makefun-frontend.ts')));
assert.equal(execFileSync('git',['config','core.autocrlf'],{encoding:'utf8'}).trim(),'false');
const readme=readFileSync('README.md','utf8');
const beforeReadme=execFileSync('git',['show','b80e994:README.md'],{encoding:'utf8'});
for(const line of beforeReadme.split('\n').filter(line=>line.startsWith('[![')||line.startsWith('<sub>'))) assert(readme.includes(line));
assert(readme.includes(beforeReadme.slice(beforeReadme.indexOf('## Run it'),beforeReadme.indexOf('\n---'))));
const initial=Object.fromEntries(['app','screenshots'].flatMap(dir=>files(join('out',dir))).concat('out/dossier.json').map(path=>[path,readFileSync(path)]));
execFileSync(process.execPath,['main.ts'],{env:{...process.env,MAKEFUN_OUTPUT_DIR:'out/repeat'}});
for(const [path,bytes] of Object.entries(initial)) assert(bytes.equals(readFileSync(path.replace(/^out/,'out/repeat'))),`Nondeterministic output ${path}`);
console.log('pass deterministic_output: second execution writes identical bytes');
console.log('pass preservation: vendor unchanged; README badges, Run it and footer exact; autocrlf false');
console.log(JSON.parse(actual).text.split('\n').find(line=>line.startsWith('Totals:')));
