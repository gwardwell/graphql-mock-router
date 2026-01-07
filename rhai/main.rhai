// import "supergraph_request_module" as supergraph_request_module;
// import "supergraph_response_module" as supergraph_response_module;
// import "subgraph_module" as subgraph_module;

fn supergraph_service(service) {
    const request_callback = Fn("process_supergraph_request");
    const response_callback = Fn("process_supergraph_response");

    service.map_request(request_callback);
    service.map_response(response_callback);
}

fn process_supergraph_request(request) {
    print("supergraph request");
    // request.context["path"] = request.uri.path;
    // request.context["query"] = request.body.query;
    // request.context["variables"] = request.body.variables;

    // // Require client info
    // let clientInfo = #{};

    // // Look for client name in headers
    // if "apollographql-client-name" in request.headers {
    //     clientInfo["clientName"] = request.headers["apollographql-client-name"];
    // } else if "apollo-client-name" in request.headers {
    //     clientInfo["clientName"] = request.headers["apollo-client-name"];
    // }

    // // Look for client version in headers
    // if "apollographql-client-version" in request.headers {
    //     clientInfo["clientVersion"] = request.headers["apollographql-client-version"];
    // } else if "apollo-client-version" in request.headers {
    //     clientInfo["clientVersion"] = request.headers["apollo-client-version"];
    // }

    // // Look for client info in the `request.body.extensions`
    // if "clientInfo" in request.body.extensions {
    //     if "clientName" in request.body.extensions.clientInfo {
    //         clientInfo["clientName"] = request.body.extensions.clientInfo.clientName;
    //     }
    //     if "clientVersion" in request.body.extensions.clientInfo {
    //         clientInfo["clientVersion"] = request.body.extensions.clientInfo.clientVersion;
    //     }
    // }

    // // If either the client name or version is missing, reject the request
    // if (
    //     clientInfo.contains("clientName") == false ||
    //     clientInfo.clientName.is_empty() == true ||
    //     clientInfo.contains("clientVersion") == false ||
    //     clientInfo.clientVersion.is_empty() == true
    // ) {
    //     throw #{
    //         status: 400,
    //         message: `${request.body.operation_name}: Please include a client name and version headers on every request from the Platform API. For more info read https://studio.apollographql.com/public/apollo-platform/variant/main/home#authenticating`
    //     };
    // }
}

fn process_supergraph_response(response) {
    print("supergraph response");
    // if !("operation_name" in response.context)
    //     || response.context["operation_name"] == ()
    //     || response.context["operation_name"] == "" {
    //     if !(response.body.extensions.contains("warnings")) {
    //         response.body.extensions["warnings"] = [];
    //     }
    //     response.body.extensions["warnings"].push("Please include a name for your operation. For more info read https://www.apollographql.com/docs/apollo-server/workflow/requests");
    // }
}

// fn subgraph_service(service, subgraph) {
// 	const request_callback = Fn("process_subgraph_request");
// 	service.map_request(request_callback);
// }

// fn process_subgraph_request(request) {
//     // let now = unix_now();
//     // let now_string = now.to_string();
//     // print("Timestamp:");
// 	// print(now_string);
// 	// throw `Subgraph Error: Terminating operation`;
// }

// fn process_subgraph_response(response) {
//     subgraph_module::process_subgraph_response(response);
// }

// fn process_supergraph_request(request) {
// 	supergraph_module::process_supergraph_request(request);
// }

// fn process_supergraph_response(response) {
// 	supergraph_module::process_supergraph_request(request);
// }

// fn supergraph_service(service) {
//     const request_callback = Fn("process_supergraph_request");
//     service.map_request(request_callback);
// }

// fn process_supergraph_request(request) {
//     const path = request.uri.path;
//     print(path);
//     if path != "/graphql" && path != "/graphql/" && path != "/api/graphql" && path != "/api/graphql/" {
//         throw #{
//             status: 404,
//             message: "Page not found."
//         };
//     }
// }

fn router_service(service) {
    const request_callback = Fn("process_router_request");
    const response_callback = Fn("process_router_response");
    service.map_request(request_callback);
    service.map_response(response_callback);
}

fn process_router_request(request) {
    print("router request");
    // const path = request.uri.path;
    // if path == "/.well-known/apollo/server-health" {
    //     throw #{
    //         status: 200,
    //         message: "Health check passed."
    //     };
    // }
    // if path != "/graphql" &&
    //     path != "/graphql/" &&
    //     path != "/api/graphql" &&
    //     path != "/api/graphql/"
    // {
    //     print(
    //         `[ERROR_UNKNOWN_PATH] Unknown path requested: ${path} with headers: ${request.headers}`
    //     );
    //     throw #{
    //         status: 404,
    //         message: "Page not found."
    //     };
    // }
}

fn process_router_response(response) {
    print("router response");
    print(response.context);
    // print(response.body);
    // if !("operation_name" in response.context) || response.context["operation_name"] == "" {
    //     if !("extensions" in response.body) {
    //         response.body.extensions = #{};
    //     }
    //     if !("warnings" in response.body.extensions) {
    //         response.body.extensions["warnings"] = [];
    //     }
    //     response.body.extensions["warnings"].push("Please include a name for your operation. For more info read https://www.apollographql.com/docs/apollo-server/workflow/requests");
    //     print(response.body.extensions);
    // }
}
