import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('page.tsx') || file.endsWith('layout.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src/app');
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const hasMeta = /export\s+const\s+metadata/.test(content);
  const hasGenMeta = /export\s+(async\s+)?function\s+generateMetadata/.test(content);
  const hasUseClient = content.includes('"use client"') || content.includes("'use client'");
  const titleMatch = content.match(/title:\s*([^\n,]+)/);
  const title = titleMatch ? titleMatch[1].trim() : 'NONE';
  const rel = path.relative('src/app', file).replace(/\\/g, '/');
  console.log(
    rel.padEnd(55),
    '|',
    (hasMeta ? 'STATIC_META' : hasGenMeta ? 'GEN_META   ' : 'NO_META    '),
    '|',
    (hasUseClient ? 'CLIENT' : 'SERVER'),
    '| title:',
    title
  );
}
