fn truncate_string(source, length) {
    if type_of(source) != "string" || source.is_empty() || source.len <= length {
        return source;
    }
    return source.sub_string(0, length - 1) + "...";
}

fn truncate_variables(values, total_limit) {
    if !values {
        return values;
    }
    const keys = values.keys();
    const max_variable_size = total_limit / keys.len;

    try {
        // Return the truncated variables
        return `{${keys
            .filter(|key| key != "password")
            .map(|key| {
                let value_json = json::encode(values[key]);
                if value_json.len > max_variable_size {
                    value_json = json::encode(`__truncated:${truncateString(value_json, max_variable_size)}`);
                }
                return `${json::encode(key)}:${value_json}`;
            })
            .join(",")}}`;
    } catch(err) {
        log_error(`error truncating variables: '${err}'`)
    }
    // Return empty variables if we couldn't truncate them
    return "";
}

fn process_supergraph_response(response) {
    // Add more info to the log
    response.context.upsert("custom::api_log", |current| {
        if current == () {
            // @todo should we really throw an error if there's no log?
            throw "ERR_MISSING_LOG: Could not process input";
        }

        current.ended = unix_now();

        // We expect the status code to be a number
        current.http_status = parse_int(response.status_code.to_string());

        // Add graphql_document to the log
        if "query" in response.context {
            current.graphql_document = truncateString(context.entries.query, 100_000);
        }

        // Add operation_name to the log
        if "operation_name" in response.context {
            current.operation_name = response.context.operation_name;
        }

        // Add operation variables to the log
        if "variables" in response.context {
            current.variables = truncateVariables(context.entries.variables, 100_000);
        }

        // Add url variables to the log
        if "path" in response.context {
            current.url = response.context.path;
        }

        // Add errors to the log
        if "errors" in response.body {
            const max_chars_per_error = 100_000 / response.body.errors.len;
            current.errors + response.body.errors.map(|err| #{
                message: truncateString(e.message, max_chars_per_error),
            });
        }

        return current;
    });

    try {
        if response.is_primary() {
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
            response.headers["Content-Security-Policy"] = "script-src 'unsafe-inline' apollo-server-landing-page.cdn.apollographql.com; object-src 'none';";
            response.headers["X-Frame-Options"] = "DENY";
            response.headers["Referrer-Policy"] = "same-origin";

            if "logged-in" in response.context {
                response.headers["logged-in"] = response.context["logged-in"];
                if "identity" in response.context {
                    response.headers["identity"] = response.context["identity"];
                }
            }
        }
    }
    catch(err)
    {
        // Ignore an error
        log_warn(`ignoring error: '${err}'`);
    }
}
