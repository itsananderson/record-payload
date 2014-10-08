var http = require('http'),
    storage = require('azure-storage');

var account = process.env.RECORD_PAYLOAD_ACCOUNT;
var key = process.env.RECORD_PAYLOAD_KEY;
var containerName = process.env.RECORD_PAYLOAD_CONTAINER || 'payload-records';

var blobService = storage.createBlobService(account, key);

console.log(String(new Date().getTime()));

blobService.createContainerIfNotExists(containerName, function(err, result, response) {
    if (err) {
        console.log("Couldn't create container %s", containerName);
        console.error(err);
    } else {
        http.createServer(function(req, res) {
            var headers = req.headers;
            var body = '';
            req.on('data', function(data) {
                body += data.toString('utf8');
            });
            req.on('end', function() {
                var payload = JSON.stringify({ headers: headers, body: body}, undefined, 2);
                blobService.createBlockBlobFromText(
                    containerName,
                    String(new Date().getTime()),
                    payload,
                    { contentType: 'text/plain' },
                    function(error, result, response){
                        if(error){
                            console.log("Couldn't upload string");
                            console.error(error);
                            res.end(error);
                        } else {
                            console.log('String uploaded successfully');
                            res.end('success');
                        }
                    });
            });
        }).listen(process.env.PORT || 3000);
    }
});
