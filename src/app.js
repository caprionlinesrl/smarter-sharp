import http from 'http';
import ImageParser from './ImageParser.js';

const hostname = '0.0.0.0';
const port = 3003;

const server = http.createServer((req, res) => {
    var image_parser = new ImageParser({
        basePath: '/shared/files'
    });

    image_parser.parse(req.url, (data, img) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'image/' + img.format);
        res.end(data);
    }, (error, img) => {
        console.log(error);
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Not found');
    });
});

server.listen(port, hostname, () => {
    console.log('Server running at http://' + hostname + ':' + port + '/');
});
