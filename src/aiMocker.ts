import { parse, print } from 'graphql';
import { Logger } from './Logger';
import { google } from '@ai-sdk/google';
import { objectToString, stringToObject } from './formatter';
import { generateText } from 'ai';
import { validateAndCorrectAiResponse } from './validateAndCorrectAiResponse';
import { getSubgraphValidators } from './validator/SubgraphValidator';

export const aiMocker = async (req, res) => {
  const {
    serviceName,
    id,
    version,
    stage,
    body: { query, variables },
  } = req.body;

  const subgraphValidators = getSubgraphValidators();

  // const normalizedQuery = addTypenameToDocument(query);
  const normalizedQuery = print(parse(query));

  const logger = new Logger(serviceName, id);

  logger.logStart('Subgraph Request');

  try {
    // const model = google('models/gemini-1.5-pro-latest');
    const model = google('models/gemini-pro');

    let promptVariables = '';
    if (variables) {
      promptVariables = `

With variables:
\`\`\`json
${objectToString(variables)}
\`\`\``;
    }

    const prompt = `Give me mock data that fulfills this query:
\`\`\`graphql
${normalizedQuery}
\`\`\`${promptVariables}`;

    logger.log('💬 Prompt:', prompt);

    const { text, finishReason, usage, warnings } = await generateText({
      model,
      prompt,
    });

    const json = stringToObject(text);

    logger.log('📝 JSON:', objectToString(json));

    let responseBody = await validateAndCorrectAiResponse(
      json,
      serviceName,
      model,
      subgraphValidators,
      normalizedQuery,
      logger,
    );

    if (!responseBody.data) {
      responseBody = {
        data: responseBody,
      };
    }

    if (json) {
      res.json({
        version,
        stage,
        control: { break: 200 },
        body: responseBody,
      });
      return;
    }

    res.json({
      version,
      stage,
      control: { break: 500 },
      body: {
        errors: ['Failed to generate a result.'],
      },
    });
    return;
  } catch (error) {
    logger.log('Encountered error:', error);

    res.json({
      version,
      stage,
      control: { break: 500 },
      body: {
        errors: [error],
      },
    });
  }
};
