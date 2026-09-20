#!/usr/bin/env node
// Build: concatenates src modules (manifest order) into the single-file game.
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, 'src');
const m = JSON.parse(fs.readFileSync(path.join(src, 'manifest.json'), 'utf8'));
const shell = fs.readFileSync(path.join(src, m.shell), 'utf8');
const js = m.modules.map(f => `/* ==== ${f} ==== */\n` + fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
const html = shell.replace('/*__MODULES__*/', () => js);
fs.writeFileSync(path.join(__dirname, 'index.html'), html);

console.log('built index.html (' + html.split('\n').length + ' lines) from ' + m.modules.length + ' modules');
