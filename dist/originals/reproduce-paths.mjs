import { readFile } from 'node:fs/promises';

const graphDocument = JSON.parse(await readFile(new URL('./graph.json', import.meta.url), 'utf8'));
const expectedDocument = JSON.parse(await readFile(new URL('./path-analysis.json', import.meta.url), 'utf8'));
const graph = new Map(Object.entries(graphDocument.adjacency));

function analyse(root, target) {
  if (!graph.has(root)) return null;
  const distances = new Map([[root, 0]]);
  const predecessors = new Map([[root, []]]);
  const queue = [root];
  while (queue.length > 0) {
    const current = queue.shift();
    const nextDistance = distances.get(current) + 1;
    for (const destination of graph.get(current) ?? []) {
      if (!distances.has(destination)) {
        distances.set(destination, nextDistance);
        predecessors.set(destination, [current]);
        queue.push(destination);
      } else if (distances.get(destination) === nextDistance) {
        predecessors.get(destination).push(current);
      }
    }
  }
  if (!distances.has(target)) return null;
  const paths = [];
  const collect = (node, reversed) => {
    if (node === root) return paths.push([root, ...reversed]);
    for (const predecessor of predecessors.get(node) ?? []) collect(predecessor, [node, ...reversed]);
  };
  collect(target, []);
  paths.sort((left, right) => left.join('\n').localeCompare(right.join('\n')));
  return { target, root, minimum_edge_count: distances.get(target), shortest_path_count: paths.length, shortest_paths: paths };
}

const actual = expectedDocument.analyses.map(({ root, target }) => analyse(root, target));
if (JSON.stringify(actual) !== JSON.stringify(expectedDocument.analyses)) {
  console.error(JSON.stringify({ status: 'failed', actual, expected: expectedDocument.analyses }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: 'verified', inventory_page_count: graphDocument.inventory_page_count, analyses: actual }, null, 2));
