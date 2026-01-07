import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const supergraphYamlFileName = `supergraph.yaml`;
const supergraphYamlPath = path.join(__dirname, supergraphYamlFileName);

/**
 * Get the byte size of a string.
 * @param {string} str - The string for which the byte size will be calculated.
 * @returns {number} The byte size of the string.
 */
const byteSize = (str) => new Blob([str]).size;

/**
 * Creates a schema string for a subgraph.
 * @param {string} name - The name of the subgraph.
 * @returns {string} The subgraph schema.
 */
function getSchema(name) {
  let schema = `extend schema
  @link(url: "https://specs.apollo.dev/federation/v2.8", import: ["@key"])

type Query {
  ${name}: ${name.toUpperCase()}!
}

type ${name.toUpperCase()} @key(fields: "id") {
  id: ID!
}`;
  let counter = 0;
  while (counter < 42000) {
    counter += 1;
    schema += `\n\nscalar customScalar${counter}`;
  }
  return schema;
}

/**
 * Get the file name for a subgraph schema.
 * @param {string} name - The subgraph name.
 * @returns {string} The file name for the subgraph schema.
 */
function getSubgraphFileName(name) {
  return `${name}-subgraph.graphql`;
}

/**
 * Get the file path for a subgraph schema.
 * @param {string} name - The name of the subgraph.
 * @returns {string} The subgraph schema file path.
 */
function getSubgraphFilePath(name) {
  return path.join(__dirname, getSubgraphFileName(name));
}

/**
 * Creates a subgraph schema and saves it to a file.
 * @param {string} name - The name of the subgraph
 */
function buildSubgraphSchema(name) {
  const subgraphSchema = getSchema(name);
  console.log(Buffer.byteLength(subgraphSchema, 'utf8'));
  const filePath = getSubgraphFilePath(name);
  console.log(filePath);
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} does not exist. Writing now.`);
    fs.writeFileSync(filePath, subgraphSchema);
  }
}

/**
 * Adds the config for a subgraph to a Supergraph config YAML string.
 * @param {string} supergraphYaml - The supergraph config YAML string.
 * @param {string} name - The subgraph name.
 * @returns {string} The updates supergraph config YAML string.
 */
function addSubgraphConfigToSupergraphYaml(supergraphYaml, name) {
  return `${supergraphYaml}
  subgraph_${name}:
    routing_url: https://localhost:4001
    schema:
      file: ./${getSubgraphFileName(name)}`;
}

/**
 * Writes the supergraph config YAML string to a YAML file.
 * @param {string} supergraphYaml - The supergraph config yaml string.
 */
function writeSupergraphYaml(supergraphYaml) {
  fs.writeFileSync(supergraphYamlPath, supergraphYaml);
}

/**
 * Composes a supergraph.
 * @returns {Promise<string>} The supergraph schema.
 */
function composeSupergraph() {
  return new Promise((resolve, reject) => {
    const spawnedProcess = spawn(
      'rover',
      ['supergraph', 'compose', '--config', `./${supergraphYamlFileName}`],
      { cwd: __dirname },
    );
    let errorData = '';
    let data = '';

    spawnedProcess.on('message', console.log);

    spawnedProcess.stdout.on('data', (chunk) => {
      // if (!silenceOutput) {
      //   console.log(chunk.toString());
      // }
      data += chunk.toString();
    });

    spawnedProcess.stderr.on('data', (chunk) => {
      errorData += chunk.toString();
    });

    spawnedProcess.on('close', function (code) {
      if (code > 0) {
        return reject(
          new Error(`${errorData} (Failed Instruction: ${instruction})`),
        );
      }

      resolve(data);
    });

    spawnedProcess.on('error', function (err) {
      reject(err);
    });
  });
}

/**
 * Builds a supergraph.
 */
async function buildSupergraph() {
  const targets = [2, 6, 10, 15, 20].sort((a, b) => b - a);
  const reachedTargets = [];
  let supergraphYaml = `
federation_version: 2
subgraphs:`;

  // 97 is the ASCII code for 'a'
  const letterA = 97;
  const letterZ = letterA + 26;

  let i = letterA;
  subgraphLoop: for (; i <= letterZ; i++) {
    const letter = String.fromCharCode(i);
    console.log(letter);
    buildSubgraphSchema(letter);
    supergraphYaml = addSubgraphConfigToSupergraphYaml(supergraphYaml, letter);
    writeSupergraphYaml(supergraphYaml);
    const supergraphSchema = await composeSupergraph();
    const supergraphSchemaSize = byteSize(supergraphSchema) / 1000000;
    console.log(supergraphSchemaSize);

    targetFileSizeLoop: for (let t = 0; t < targets.length; t += 1) {
      const target = targets[t];
      if (supergraphSchemaSize > target && !reachedTargets.includes(target)) {
        reachedTargets.push(target);
        supergraphYaml += `
  # END ${target}MB SUPERGRAPH`;
        writeSupergraphYaml(supergraphYaml);
        if (reachedTargets.length === targets.length) {
          break subgraphLoop;
        }
        break targetFileSizeLoop;
      }
    }
  }
}

buildSupergraph();
