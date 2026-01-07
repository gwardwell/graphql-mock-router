export const renamer = async (req, res) => {
  let { serviceName, id, version, stage, body, control, uri, context } =
    req.body;

  // console.log('\n\nrenamer req.body:', req.body);

  switch (stage) {
    case 'SupergraphRequest':
      handleSupergraphRequest(req, res);
      break;
    case 'SubgraphRequest':
      // console.log('body.query before:', body.query);
      // context.entries.original_query = body.query;
      // body.query = body.query.replace(/graph/gi, 'batman');
      // console.log('body.query after:', body.query);
      control = {
        break: 200,
      };
      break;
    case 'SubgraphResponse':
      break;
    case 'SupergraphResponse':
      handleSupergraphResponse(req, res);
      break;
  }

  // const { query, variables } = body;

  const response = {
    version,
    stage,
    control,
    uri: 'http://localhost:3000/graphql',
    // control: { break: 200 },
    body,
  };

  // console.log('\n\nCOPROCESSOR Response:', response);

  res.json(response);
};

function handleSupergraphRequest(req, res) {
  let {
    serviceName,
    id,
    version,
    stage,
    body,
    control,
    uri,
    context,
    method,
    headers,
  } = req.body;

  const started = new Date();

  const newLog = {
    // We cannot distinguish those 2 today
    started,
    graphql_started: started,
    http_method: method,
    request_id: headers['x-request-id']?.[0],
    node_name: process.env.NODE_NAME,
    pod_name: process.env.POD_NAME,
    env: process.env.STACK || 'missing',
    // api_key_prefix: extractApiKeyPrefix(headers),
    host: headers['host']?.[0],
    xff: headers['x-forwarded-for']?.[0],
    sudo_header: headers['apollo-sudo']?.[0],
    user_agent: headers['user-agent']?.[0],
    client_name: truncateString(
      headers['apollo-client-name']?.[0] ||
        headers['apollographql-client-name']?.[0],
      5,
    ),
    client_version:
      headers['apollo-client-version']?.[0] ||
      headers['apollographql-client-version']?.[0],
    attachments: [],
    downstream_kubernetes_info: [],
  };

  if (
    context?.entries?.['custom::operation'] &&
    context?.entries['custom::operation'].indexOf('query A') !== -1
  ) {
    console.log('coprocessor log:', JSON.stringify(newLog, null, 2));
  }
}

function handleSupergraphResponse(req, res) {
  let {
    serviceName,
    id,
    version,
    stage,
    body,
    control,
    uri,
    context,
    method,
    headers,
  } = req.body;

  if (
    context?.entries?.['custom::operation'] &&
    context?.entries['custom::operation'].indexOf('query A') !== -1
  ) {
    const log = context.entries['custom::api_log'];
    log.started = new Date(log.started);
    log.graphql_started = new Date(log.graphql_started);
    console.log(
      'context.entries["custom::api_log"]',
      JSON.stringify(log, null, 2),
    );
  }
}

function truncateString(source: string, length: number) {
  if (!source || source.length <= length) return source;
  return source.substring(0, length - 1) + '…';
}
