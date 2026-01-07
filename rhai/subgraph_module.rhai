fn process_subgraph_response(response) {
    if "logged-in" in response.headers {
        response.context["logged-in"] = response.headers["logged-in"];
        if "identity" in response.headers {
            response.context.identity = response.headers["identity"].to_string();
        }
    }

     // Add more info to the log
     response.context.upsert("custom::api_log", |current| {
        if current == () {
            // @todo should we really throw an error if there's no log?
            throw "ERR_MISSING_LOG: Could not process input";
        }

        // Add identity to the log
        if "identity" in response.context {
            current.identity = response.context.identity;
        }

        // Add downstream k8s info to the log
        const downstream_k8s_info = #{};

        if "kubernetes-node-name" in response.headers {
            downstream_k8s_info.node_name = response.headers["kubernetes-node-name"];
        }

        if "kubernetes-pod-name" in response.headers {
            downstream_k8s_info.pod_name = response.headers["kubernetes-pod-name"];
        }

        if !("downstream_kubernetes_info" in current) {
            current.downstream_kubernetes_info = [];
        }

        if "node_name" in downstream_k8s_info || "pod_name" in downstream_k8s_info {
            current.downstream_kubernetes_info.push(downstream_k8s_info);
        }

        // Add attachments to the log
        if !("attachments" in current) {
            current.attachments = [];
        }

        if "extensions" in response.body && "apilog-attachments" in response.body.extensions {
            try {
                const attachments = json::decode(response.body.extensions["apilog-attachments"]);
                current.attachments + attachments;
            } catch(err) {
                log_error(`Cannot decode apilog-attachments: ${err}`);
            }
        }

        return current;
    });
}
