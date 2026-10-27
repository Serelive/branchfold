import { build } from 'esbuild';
import { cp, mkdir } from 'node:fs/promises';
await mkdir('extension/dist', { recursive: true });
await build({ entryPoints: ['extension/extension.mjs'], outfile: 'extension/dist/extension.cjs', bundle: true, platform: 'node', format: 'cjs', external: ['vscode'], target: 'node20' });
await cp('dist', 'extension/dist/web', { recursive: true });
