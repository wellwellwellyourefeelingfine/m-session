import { readFileSync, writeFileSync } from 'fs';

const today = new Date().toISOString().split('T')[0];
const sitemap = readFileSync('dist/sitemap.xml', 'utf8');
const updated = sitemap.replace(/<lastmod>[^<]*<\/lastmod>/g, `<lastmod>${today}</lastmod>`);
writeFileSync('dist/sitemap.xml', updated);
console.log(`Sitemap lastmod dates stamped to ${today}`);
