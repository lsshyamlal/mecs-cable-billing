#!/usr/bin/env bash
# Safe regression command. It does not start the app or connect to PostgreSQL.
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "Running backend regression tests…"
mvn test

echo "Checking Help / User Guide content…"
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseGuide, searchTopics } from './frontend/src/utils/helpGuide.js';
const handbook = readFileSync('./docs/ADMIN_USER_GUIDE.md', 'utf8');
const { topics } = parseGuide(handbook);
assert(topics.length > 0, 'The handbook must contain topics.');
assert.equal(new Set(topics.map(topic => topic.id)).size, topics.length, 'Guide topic links must be unique.');
for (const [, anchor] of handbook.matchAll(/\]\(#([^)]*)\)/g)) assert(topics.some(topic => topic.id === anchor), `Unresolved guide link: #${anchor}`);
assert(searchTopics(topics, 'payment').length > 0, 'Guide search must find payment instructions.');
console.log(`Guide checks passed for ${topics.length} topics.`);
NODE

echo "Building frontend…"
(cd frontend && npm run build)
echo "Regression suite passed."
