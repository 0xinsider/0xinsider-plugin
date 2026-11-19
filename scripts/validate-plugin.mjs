#!/usr/bin/env node

// Single-plugin check for this folder. Equivalent to the path, name, and
// frontmatter checks in https://github.com/cursor/plugin-template
// scripts/validate-template.mjs, plus the marketplace rule that every
// ${VAR} in mcp.json is declared on the manifest. Run from anywhere:
//   node scripts/validate-plugin.mjs

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const pluginDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const errors = [];

const pluginNamePattern = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
const placeholderPattern = /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

function fail(message) {
  errors.push(message);
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function parseFrontmatter(content) {
  const normalized = content.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return null;
  }
  const closingIndex = normalized.indexOf("\n---\n", 4);
  if (closingIndex === -1) {
    return null;
  }
  const fields = {};
  for (const line of normalized.slice(4, closingIndex).split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }
    fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return fields;
}

function isSafeRelativePath(value) {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return true;
  }
  if (path.isAbsolute(value) || path.win32.isAbsolute(value)) {
    return false;
  }
  const normalized = path.posix.normalize(value.replace(/\\/g, "/"));
  return !normalized.startsWith("../") && normalized !== "..";
}

function collectPlaceholders(value, found) {
  if (typeof value === "string") {
    for (const match of value.matchAll(placeholderPattern)) {
      found.add(match[1]);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      collectPlaceholders(entry, found);
    }
    return;
  }
  if (value && typeof value === "object") {
    for (const entry of Object.values(value)) {
      collectPlaceholders(entry, found);
    }
  }
}

async function main() {
  const manifestPath = path.join(pluginDir, ".cursor-plugin", "plugin.json");
  let manifest;
  try {
    manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch (error) {
    fail(`plugin.json is missing or invalid JSON: ${error.message}`);
    return finish();
  }

  if (typeof manifest.name !== "string" || !pluginNamePattern.test(manifest.name)) {
    fail('plugin.json "name" must be lowercase kebab-case and start and end with an alphanumeric character.');
  }
  if (manifest.name !== "0xinsider") {
    fail(`plugin.json "name" must be "0xinsider" (got ${JSON.stringify(manifest.name)}).`);
  }
  for (const field of ["displayName", "description", "version", "license"]) {
    if (typeof manifest[field] !== "string" || manifest[field].trim() === "") {
      fail(`plugin.json "${field}" must be a non-empty string.`);
    }
  }
  if (!manifest.author || typeof manifest.author.name !== "string" || manifest.author.name.trim() === "") {
    fail('plugin.json "author.name" is required.');
  }
  if (!Array.isArray(manifest.keywords) || manifest.keywords.length === 0) {
    fail('plugin.json "keywords" must be a non-empty array.');
  }
  if (typeof manifest.logo !== "string" || !isSafeRelativePath(manifest.logo) || manifest.logo.startsWith("http")) {
    fail('plugin.json "logo" must be a relative path inside this folder.');
  } else {
    const logoPath = path.resolve(pluginDir, manifest.logo);
    if (!(await exists(logoPath))) {
      fail(`logo file is missing: ${manifest.logo}`);
    }
  }

  const mcpPath = path.join(pluginDir, "mcp.json");
  let mcp;
  try {
    mcp = JSON.parse(await fs.readFile(mcpPath, "utf8"));
  } catch (error) {
    fail(`mcp.json is missing or invalid JSON: ${error.message}`);
    mcp = null;
  }
  if (mcp) {
    const servers = mcp.mcpServers;
    if (!servers || typeof servers !== "object" || Array.isArray(servers)) {
      fail('mcp.json "mcpServers" must be an object.');
    } else {
      const analytics = servers.analytics;
      if (!analytics || analytics.url !== "https://api.0xinsider.com/api/v1/mcp") {
        fail('mcp.json server "analytics" must use url "https://api.0xinsider.com/api/v1/mcp".');
      }
    }
    const used = new Set();
    collectPlaceholders(mcp, used);
    const declared = new Set(Object.keys(manifest.variables?.properties ?? {}));
    for (const name of used) {
      if (!declared.has(name)) {
        fail(`mcp.json uses \${${name}} but plugin.json variables.properties does not declare it.`);
      }
    }
    if (manifest.variables) {
      const schema = manifest.variables;
      if (schema.type !== "object" || !schema.properties || typeof schema.properties !== "object") {
        fail('plugin.json "variables" must be a JSON Schema object with "type": "object" and "properties".');
      }
    }
  }

  const skillsDir = path.join(pluginDir, "skills");
  const skillDirs = await fs.readdir(skillsDir, { withFileTypes: true });
  const skillNames = [];
  for (const entry of skillDirs) {
    if (!entry.isDirectory()) {
      continue;
    }
    const skillPath = path.join(skillsDir, entry.name, "SKILL.md");
    if (!(await exists(skillPath))) {
      fail(`skills/${entry.name} has no SKILL.md`);
      continue;
    }
    const parsed = parseFrontmatter(await fs.readFile(skillPath, "utf8"));
    if (!parsed) {
      fail(`skills/${entry.name}/SKILL.md is missing YAML frontmatter.`);
      continue;
    }
    if (!parsed.name || !parsed.description) {
      fail(`skills/${entry.name}/SKILL.md needs name and description frontmatter.`);
    }
    if (parsed.name !== entry.name) {
      fail(`skills/${entry.name}/SKILL.md name is "${parsed.name}", expected "${entry.name}".`);
    }
    if (parsed.name && !pluginNamePattern.test(parsed.name)) {
      fail(`skill name "${parsed.name}" must be lowercase kebab-case.`);
    }
    skillNames.push(parsed.name);
  }
  if (skillNames.length < 3 || skillNames.length > 5) {
    fail(`expected 3 to 5 skills, found ${skillNames.length}.`);
  }

  const textFiles = [manifestPath, mcpPath, path.join(pluginDir, "README.md"), path.join(pluginDir, "LICENSE")];
  for (const name of skillNames) {
    textFiles.push(path.join(skillsDir, name, "SKILL.md"));
  }
  for (const filePath of textFiles) {
    const text = await fs.readFile(filePath, "utf8");
    if (text.includes("\u2014") || text.includes("\u2013")) {
      fail(`${path.relative(pluginDir, filePath)} contains an em dash or en dash.`);
    }
    if (/oxi_[A-Za-z0-9_]{8,}|sk_live_|Bearer [A-Za-z0-9._\-]{20,}/.test(text)) {
      fail(`${path.relative(pluginDir, filePath)} looks like it contains a credential.`);
    }
  }

  return finish();
}

function finish() {
  if (errors.length > 0) {
    console.error("Validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }
  console.log("Validation passed.");
}

await main();
