fn process_supergraph_request(request) {
    // Populate for apilogger
    request.context["path"] = request.uri.path;
    request.context["query"] = request.body.query;
    request.context["variables"] = request.body.variables;

    // Get the client info
    let client_info = #{};

    // Look for client name in headers
    if "apollographql-client-name" in request.headers {
        client_info["clientName"] = request.headers["apollographql-client-name"];
    } else if "apollo-client-name" in request.headers {
        client_info["clientName"] = request.headers["apollo-client-name"];
    }

    // Look for client version in headers
    if "apollographql-client-version" in request.headers {
        client_info["clientVersion"] = request.headers["apollographql-client-version"];
    } else if "apollo-client-version" in request.headers {
        client_info["clientVersion"] = request.headers["apollo-client-version"];
    }

    // Look for client info in the `request.body.extensions`
    if "clientInfo" in request.body.extensions {
        if "clientName" in request.body.extensions.clientInfo {
            client_info["clientName"] = request.body.extensions.clientInfo.clientName;
        }
        if "clientVersion" in request.body.extensions.clientInfo {
            client_info["clientVersion"] = request.body.extensions.clientInfo.clientVersion;
        }
    }

    // Find our cookies
    if "cookie" in request.headers {
        try {
            let cookies = request.headers["cookie"].split(';');
            for cookie in cookies {
                // Split our cookies into name and value
                let k_v = cookie.split('=', 2);
                if k_v.len() == 2 {
                    // trim off any whitespace
                    k_v[0].trim();
                    k_v[1].trim();

                    if k_v[0] == "authtoken" && request.headers.contains("x-api-key") == false {
                        try {
                            let api_key = urldecode(k_v[1]);
                            request.headers["x-api-key"] = api_key;
                        } catch(err) {
                            log_error(`couldnt urldecode authtoken error: ${err}`);
                        }
                    }
                    if k_v[0] == "session-token" && request.headers.contains("x-session-token") == false {
                        try {
                            let session_token = urldecode(k_v[1]);
                            request.headers["x-session-token"] = session_token;
                        } catch(err) {
                            log_error(`couldnt urldecode session-token error: ${err}`);
                        }
                    }
                }
            }
        } catch(err) {
            log_warn(`could not process cookies: ${err}`);
        }
    } else {
        log_trace("no cookies in request");
    }

    // If the cookie was used above, the x-api-key header will be set.
    // It may have already been set, too.
    // With the header set, and assuming a header of:
    //   x-api-key: thing1:thing2:secret
    // Take the header value and preserve the account for the request
    // in the request context.  We'll use this later to assign the value
    // to a custom span attribute.
    if "x-api-key" in request.headers {
        let parts = request.headers["x-api-key"].split(':');
        if parts.len() == 3 {
            // Set the apollo-key-account request context to part 1 but only
            // the first 60 characters of it.
            request.context["apollo-key-account"] = parts[1].sub_string(0, 30);
        }
    }

    // Create the initial log
    const current_time = unix_ms_now();

    const new_log = #{
        started: current_time,
        graphql_started: current_time,
        http_method: request.method.to_string(),
        attachments: [],
        downstream_kubernetes_info: [],
    };

    // Add the client_name to the log
    if "clientName" in client_info {
        new_log.client_name = client_info.clientName;
    }

    // Add the client_version to the log
    if "clientVersion" in client_info {
        new_log.client_version = client_info.clientVersion;
    }

    // Add the api_key_prefix to the log
    if "x-api-key" in request.headers && request.headers["x-api-key"] {
        // The x-api-key header is either the actual header provided
        // or the authtoken from cookies.
        const key = request.headers["x-api-key"];
        new_log.api_key_prefix = key.split(":", 2).join(":");
    }

    // Add request_id to the log
    if "x-request-id" in request.headers {
        new_log.request_id = request.headers["x-request-id"];
    }

    // Add host to the log
    if "host" in request.headers {
        new_log.host = request.headers["host"];
    }

    // Add xff to the log
    if "x-forwarded-for" in request.headers {
        new_log.xff = request.headers["x-forwarded-for"];
    }

    // Add sudo_header to the log
    if "apollo-sudo" in request.headers {
        new_log.sudo_header = request.headers["apollo-sudo"];
    }

    // Add user_agent to the log
    if "user-agent" in request.headers {
        new_log.user_agent = request.headers["user-agent"];
    }

    // Add the node_name to the log
    try {
        new_log.node_name = env::get("NODE_NAME");
    } catch(err) {
        log_warn(`Cannot get NODE_NAME from env: ${err}`);
    }

    // Add the pod_name to the log
    try {
        new_log.pod_name = env::get("POD_NAME");
    } catch(err) {
        log_warn(`Cannot get POD_NAME from env: ${err}`);
    }

    // Add the env name to the log
    const missing_stack = "missing";
    try {
        const stack = env::get("STACK");
        new_log.env = if stack { stack } else { missing_stack };
    } catch(err) {
        new_log.env = missing_stack;
    }

    // Save the log to the router context
    request.context["custom::api_log"] = new_log;
}
