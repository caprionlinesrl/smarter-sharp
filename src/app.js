import http from 'http';
import process from 'process';
import { parseOptions } from './options.js';
import { processImageWithCache } from './image.js';

const options = parseOptions(process.argv, {
    hostname: '0.0.0.0',
    port: 3003,
    baseDir: '.',
    cacheDir: './cache'
});

const server = http.createServer((req, res) => {
    processImageWithCache(req.url, options)
        .then(result => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'image/' + result.imageData.format);
            res.end(Buffer.from(result.data));
        })
        .catch(err => {
            console.error(err);

            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Not found');
        })
});

server.listen(options.port, options.hostname, () => {
    console.warn(
        'Server running at http://' + options.hostname + ':' + options.port + '/ ' +
        'on baseDir ' + options.baseDir + ' ' +
        'on cacheDir ' + options.cacheDir
    );
});
