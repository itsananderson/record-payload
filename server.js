var http = require('http'),
    storage = require('azure-storage'),
    rawBody = require('raw-body'),
    typer = require('media-typer');

var account = process.env.RECORD_PAYLOAD_ACCOUNT;
var key = process.env.RECORD_PAYLOAD_KEY;
var containerName = process.env.RECORD_PAYLOAD_CONTAINER || 'payload-records';
var maxBodySize = process.env.RECORD_PAYLOAD_MAX_BODY_SIZE || '1mb';

var blobService = storage.createBlobService(account, key);

blobService.createContainerIfNotExists(containerName, function(err, result, response) {
    if (err) {
        console.log("Couldn't create container %s", containerName);
        console.error(err);
    } else {
        http.createServer(function(req, res) {

            function send(body) {
                res.setHeader('Content-Type', 'text/plain');
                res.end(body);
            }

            var headers = req.headers;
            rawBody(req, {
                limit: maxBodySize,
                encoding: req.headers['content-type'] ? typer.parse(req.headers['content-type']).parameters.charset : 'utf-8'
            }, function(err, body) {
                if (err) {
                    send(err.toString());
                }

                var bodyStr = body.toString('utf8');
                var bodyObj;

                try {
                    bodyObj = JSON.parse(bodyStr);
                } catch (e) {
                    console.error(e);
                    bodyObj = bodyStr;
                }

                var payload = JSON.stringify({
                    url: req.url,
                    method: req.method,
                    headers: headers,
                    body: bodyObj
                }, undefined, 2);

                blobService.createBlockBlobFromText(
                    containerName,
                    String(new Date().getTime()),
                    payload,
                    { contentType: 'application/json' },
                    function(error, result, response){
                        if(error){
                            console.log("Couldn't upload payload");
                            console.error(error);
                            send(error);
                        } else {
                            console.log('Payload uploaded successfully');
                            send('success');
                        }
                    });
            });
        }).listen(process.env.PORT || 3000);
    }
});
