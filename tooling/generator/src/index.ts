import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync, rmSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { execSync } from 'child_process';

interface ProjectSpec {
  name: string;
  stack: 'typescript' | 'python';
  kind: 'cli' | 'web' | 'api' | 'lib' | 'data';
  description: string;
  features: string[];
  purpose: string;
}

interface Registry {
  projects: ProjectSpec[];
}

const ROOT = resolve(import.meta.dirname, '..');
const TEMPLATES_DIR = join(ROOT, 'templates');
const OUTPUT_DIR = resolve(ROOT, '..', '..');
const GH_EXE = 'C:\\Program Files\\GitHub CLI\\gh.exe';

function log(msg: string) {
  console.log(`[generator] ${msg}`);
}

function replacePlaceholders(content: string, spec: ProjectSpec): string {
  const cliName = spec.name.replace(/-/g, '_');
  return content
    .replace(/\{\{name\}\}/g, spec.name)
    .replace(/\{\{description\}\}/g, spec.description)
    .replace(/\{\{cli_name\}\}/g, cliName);
}

function scaffoldProject(spec: ProjectSpec): string {
  const templateDir = join(TEMPLATES_DIR, spec.stack, spec.kind);
  if (!existsSync(templateDir)) {
    throw new Error(`Template not found: ${templateDir}`);
  }

  const projectDir = join(OUTPUT_DIR, spec.name);
  if (existsSync(projectDir)) {
    log(`Project ${spec.name} already exists at ${projectDir}, removing...`);
    rmSync(projectDir, { recursive: true });
  }

  log(`Scaffolding ${spec.name} (${spec.stack}/${spec.kind})...`);
  copyRecursiveSync(templateDir, projectDir);

  renderDirectory(projectDir, spec);
  return projectDir;
}

function copyRecursiveSync(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursiveSync(s, d);
    } else {
      writeFileSync(d, readFileSync(s));
    }
  }
}

function renderDirectory(dir: string, spec: ProjectSpec) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      renderDirectory(full, spec);
    } else {
      const content = readFileSync(full, 'utf-8');
      if (content.includes('{{')) {
        writeFileSync(full, replacePlaceholders(content, spec), 'utf-8');
      }
    }
  }
}

function installDeps(projectDir: string, spec: ProjectSpec) {
  log(`Installing dependencies for ${spec.name}...`);
  if (spec.stack === 'typescript') {
    execSync('npm install --prefer-offline 2>&1', { cwd: projectDir, stdio: 'inherit', timeout: 120_000 });
  }
}

function runTests(projectDir: string, spec: ProjectSpec): boolean {
  log(`Running tests for ${spec.name}...`);
  try {
    if (spec.stack === 'typescript') {
      const vitestPath = join(projectDir, 'node_modules', '.vitest-*');
      execSync(`npx vitest run 2>&1`, { cwd: projectDir, stdio: 'inherit', timeout: 60_000 });
    } else {
      execSync('python -m pytest 2>&1', { cwd: projectDir, stdio: 'inherit', timeout: 60_000 });
    }
    return true;
  } catch (e) {
    log(`Tests FAILED for ${spec.name}`);
    return false;
  }
}

function initAndPush(projectDir: string, spec: ProjectSpec) {
  log(`Initializing git and pushing ${spec.name}...`);

  const readmePath = join(projectDir, 'README.md');
  const readme = `# ${spec.name}

${spec.description}

## Purpose

${spec.purpose}

## Features

${spec.features.map((f) => `- ${f}`).join('\n')}

## Usage

See [package.json](package.json) for available scripts.
`;
  writeFileSync(readmePath, readme, 'utf-8');

  const licensePath = join(projectDir, 'LICENSE');
  if (!existsSync(licensePath)) {
    const licenseContent = `MIT License

Copyright (c) 2026 Slav Hayrapetyan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
...
`;
    writeFileSync(licensePath, licenseContent, 'utf-8');
  }

  execSync('git init', { cwd: projectDir, stdio: 'pipe' });

  const excludes = ['node_modules/', 'dist/', '__pycache__/', '*.pyc', '.next/', '.env'];
  const gitignorePath = join(projectDir, '.gitignore');
  if (!existsSync(gitignorePath)) {
    writeFileSync(gitignorePath, excludes.join('\n') + '\n', 'utf-8');
  }

  execSync('git add -A', { cwd: projectDir, stdio: 'pipe' });
  execSync(`git commit -m "Initial: ${spec.description}"`, { cwd: projectDir, stdio: 'pipe' });

  try {
    const result = execSync(
      `"${GH_EXE}" repo create SlavH/${spec.name} --public --source="${projectDir}" --push 2>&1`,
      { stdio: 'pipe', timeout: 60_000, encoding: 'utf-8' }
    );
    log(`Published: https://github.com/SlavH/${spec.name}`);
    return true;
  } catch (e: any) {
    const msg = e.stdout || e.stderr || String(e);
    log(`Push failed for ${spec.name}: ${msg.slice(0, 200)}`);
    return false;
  }
}

async function main() {
  const registryPath = join(ROOT, 'projects.json');
  if (!existsSync(registryPath)) {
    log('ERROR: projects.json not found in tooling/generator/');
    process.exit(1);
  }

  const registry: Registry = JSON.parse(readFileSync(registryPath, 'utf-8'));
  const results: { name: string; status: string; url?: string }[] = [];

  for (const spec of registry.projects) {
    log(`\n=== Processing ${spec.name} ===`);
    try {
      const projectDir = scaffoldProject(spec);
      log(`Scaffolded at ${projectDir}`);

      if (spec.stack === 'typescript') {
        installDeps(projectDir, spec);
      }

      const testsPassed = runTests(projectDir, spec);
      if (!testsPassed) {
        results.push({ name: spec.name, status: 'TEST_FAILED' });
        continue;
      }

      const pushed = initAndPush(projectDir, spec);
      results.push({
        name: spec.name,
        status: pushed ? 'PUBLISHED' : 'COMMITTED_LOCAL',
        url: pushed ? `https://github.com/SlavH/${spec.name}` : undefined,
      });
    } catch (e: any) {
      log(`ERROR on ${spec.name}: ${e.message}`);
      results.push({ name: spec.name, status: `ERROR: ${e.message}` });
    }
  }

  console.log('\n=== RESULTS ===');
  for (const r of results) {
    console.log(`  ${r.status === 'PUBLISHED' ? '✅' : '❌'} ${r.name}: ${r.status}${r.url ? ` (${r.url})` : ''}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
