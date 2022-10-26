import http from 'http';
import process from 'process';
import ImageParser from './ImageParser.js';
import FilesystemCache from "node-filesystem-cache";

var args = {
    hostname: '0.0.0.0',
    port: 3003,
    basedir: '.',
    cachedir: './cache'
};

process.argv.forEach(arg => {
    // format: --name=value
    if (arg.startsWith('--') && arg.includes('=')) {
        var name = arg.substring(2).split('=')[0];
        args[name] = arg.split('=')[1];
    }
});

const server = http.createServer((req, res) => {
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
});

server.listen(args.port, args.hostname, () => {
    console.log(
        'Server running at http://' + args.hostname + ':' + args.port + '/ ' +
        'on basedir ' + args.basedir
    );
});
