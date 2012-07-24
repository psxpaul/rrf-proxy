var http = require("http"),
    remoteRequest = require("request"),
    port = process.env.PORT || 5000;

http.createServer(function (request, response) {
    var headers,
        options = {
            uri: "http://www.realramsfans.com" + request.url,
            method: request.method,
            jar: false,
            encoding: null
        };

    headers = request.headers;
    headers.host = "www.realramsfans.com";
    headers.referer = (headers.referer) ? headers.referer.replace("rrf-proxy.herokuapp.com", "www.realramsfans") : undefined;
    delete headers["accept-encoding"];
    headers.connection = "close";
    options.headers = headers;

    request.on("data", function (chunk) {
        if (typeof options.body === "undefined") {
            options.body = "";
        }

        options.body += chunk.toString();
    });

    request.on("end", function () {
        console.log(options.method + " " + options.uri + " " + (options.body ? options.body : ""));

        remoteRequest(options, function (error, remoteResponse, body) {
            var newBody = body,
                responseHeaders = remoteResponse.headers;

            if (remoteResponse.statusCode === 302 || remoteResponse.statusCode === 307) {
                if (!responseHeaders.location) {
                    responseHeaders.location = remoteResponse.Location;
                }
            }
        
            if (responseHeaders["content-type"] === "text/html") {
                if (body) {
                    newBody = body.toString("binary");

                    newBody = newBody.replace("<body ", "<body style='overflow: visible;' ");
                    newBody = newBody.replace('<div id="header"><img src="images/r2fHeader.jpg"></div>', "");
                    newBody = newBody.replace('<div id="contents">', "");
                    newBody = newBody.replace('</div>\n<div id="footer"><img src="images/r2fFooter.jpg"></div>', "");

                    responseHeaders["content-length"] = newBody.length;
                    newBody = new Buffer(newBody, "binary");
                }
            }

            response.writeHead(remoteResponse.statusCode, responseHeaders);

            if (newBody) {
                response.write(newBody, "binary");
            }

            response.end();
        });
    });
}).listen(port, function () {
    console.log("Listening on " + port);
});
