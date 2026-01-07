import dotenv from 'dotenv';
import express from 'express';
import { createSubgraphValidators } from './validator/SubgraphValidator';
import { promises as fs } from 'fs';
import { Supergraph } from '@apollo/federation-internals';
import { aiMocker } from './aiMocker';
import { renamer } from './renamer';
import { subgraph } from './subgraph';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

app.post('/mock', aiMocker);
app.post('/rename', renamer);
app.post('/graphql', subgraph);

app.listen(port, async () => {
  try {
    const supergraphSchema = await fs.readFile('supergraph-schema.graphql', {
      encoding: 'utf-8',
    });
    const supergraph = Supergraph.build(supergraphSchema);
    const subgraphs = supergraph.subgraphs();
    createSubgraphValidators(subgraphs);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('❌ No supergraph schema found.');
    } else {
      throw error;
    }
  }
  console.log(`✅ Supergraph schema loaded`);
  console.log(`🚀 Coprocessor running on port ${port}`);
});
