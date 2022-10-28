import http from 'http';
import process from 'process';
import FilesystemCache from "node-filesystem-cache";
import { parseOptions } from './options.js';
import { parseUrl, parseSmart, parsePosition } from './image.js';

const options = parseOptions(process.argv, {
    hostname: '0.0.0.0',
    port: 3003,
    baseDir: '.',
    cacheDir: './cache'
});

const server = http.createServer((req, res) => {
    parseUrl(req.url, options)
        .then(imageData => {
            return imageData.position === 'smart'
                ? parseSmart(imageData, options)
                : parsePosition(imageData, options);
        })
        .then(result => {
            console.log(result);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'image/' + result.imageData.format);
            res.end(Buffer.from(result.data));
        })
        .catch(err => {
            console.log(err);

            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Not found');
        });

    /*
    const cache = new FilesystemCache(args.cachedir);

    var item = cache.get(req.url);

    if (item !== null) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'image/' + item.args.format);
        res.end(Buffer.from(item.data.data));
        return;
    }

    var image_parser = new ImageParser({
        basedir: args.basedir
    });

    image_parser.parse(
        req.url,
        (data, img) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'image/' + img.format);
            res.end(data);

            cache.put(req.url, { data: data, args: img });
        },
        (error, img) => {
            console.log(error);
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Not found');
        }
    );
    */
});

server.listen(options.port, options.hostname, () => {
    console.log(
        'Server running at http://' + options.hostname + ':' + options.port + '/ ' +
        'on baseDir ' + options.baseDir
    );
});
