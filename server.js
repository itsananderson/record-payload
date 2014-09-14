var http = require('http'),
    storage = require('azure-storage');

var account = process.env.RECORD_PAYLOAD_ACCOUNT;
var key = process.env.RECORD_PAYLOAD_KEY;

var blobService = storage.createBlobService(account, key);

var containerName = 'payload-records';

console.log(String(new Date().getTime()));

blobService.createContainerIfNotExists(containerName, function(err, result, response) {
    if (err) {
        console.log("Couldn't create container %s", containerName);
        console.error(err);
    } else {
        http.createServer(function(req, res) {
            var payload = JSON.stringify(req.headers, undefined, 2) + '\n\n';
            req.on('data', function(data) {
                payload += data.toString('utf8');
            });
            req.on('end', function() {
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
