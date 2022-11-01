import FilesystemCache from "node-filesystem-cache";
import url from 'url';
import sharp from 'sharp';
import smartcrop from 'smartcrop-sharp';
//import { parseFaces } from './faceapi.js';

export const processImageWithCache = (imageUrl, options) => new Promise((resolve, reject) => {
    const cache = new FilesystemCache(options.cacheDir);

    var result = cache.get(imageUrl);

    if (result !== null) {
        resolve(result);
        return;
    }

    processImage(imageUrl, options)
        .then(result => {
            resolve(result);
            cache.put(imageUrl, result);
        })
        .catch(reject);
});

export const processImage = (imageUrl, options) => new Promise((resolve, reject) => {
    parseUrl(imageUrl, options)
        //.then(imageData => parseFaces(imageData, options))
        .then(imageData => {
            return imageData.position === 'smart'
                ? parseSmart(imageData, options)
                : parsePosition(imageData, options);
        })
        .then(resolve)
        .catch(reject);
});

const parseUrl = (imageUrl, options) => new Promise((resolve, reject) => {
    var result = {
        path: '',
        width: 0,
        height: 0,
        shortSide: 0,
        longSide: 0,
        format: 'jpeg',
        quality: 80,
        position: 'smart',
        fit: 'cover',
        minScale: 1,
        sharpen: 0,
        boost: [],
        facesBoost: []
    };

    var formats = [
        'jpeg',
        'png',
        'webp'
    ];

    var positions = [
        'smart',
        'entropy',
        'attention',
        'center',
        'top',
        'rightTop',
        'right',
        'rightBottom',
        'bottom',
        'leftBottom',
        'left',
        'leftTop'
    ];

    var fits = [
        'cover',
        'contain'
    ];

    var parsedUrl = url.parse(imageUrl);

    result.path = decodeURI(parsedUrl.pathname);

    if (parsedUrl.query) {
        parsedUrl.query.split('&').forEach(arg => {
            var [name, value] = arg.split('=');

            if (['width', 'height', 'shortSide', 'longSide'].includes(name)) {
                result[name] = parseInt(value);
            }
            else if (name === 'format' && formats.includes(value)) {
                result.format = value;
            }
            else if (name === 'quality') {
                result.quality = parseInt(value);
            }
            else if (name === 'position' && positions.includes(value)) {
                result.position = value;
            }
            else if (name === 'fit' && fits.includes(value)) {
                result.fit = value;
            }
            else if (name === 'minScale') {
                result.minScale = parseFloat(value);
            }
            else if (name === 'sharpen') {
                result.sharpen = parseFloat(value);
            }
            else if (name === 'boost') {
                const boost = value.split(',');

                result.boost = [{
                    x: boost[0] ?? 0,
                    y: boost[1] ?? 0,
                    width: boost[2] ?? 0,
                    height: boost[3] ?? 0,
                    weight: 1
                }];
            }
        });
    }

    sharp(options.baseDir + result.path)
        .metadata()
        .then(metadata => {
            if (result.shortSide > 0) {
                if (metadata.width < metadata.height) {
                    result.width = result.shortSide;
                }
                else {
                    result.height = result.shortSide;
                }
            }
            else if (result.longSide > 0) {
                if (metadata.width > metadata.height) {
                    result.width = result.longSide;
                }
                else {
                    result.height = result.longSide;
                }
            }

            if (result.width == 0 && result.height == 0) {
                result.width = metadata.width;
                result.height = metadata.height;
            }
            else if (result.width > 0 && result.height == 0) {
                result.height = parseInt(result.width * metadata.height / metadata.width);
            }
            else if (result.width == 0 && result.height > 0) {
                result.width = parseInt(result.height * metadata.width / metadata.height);
            }

            resolve(result);
        })
        .catch(reject);
});

const parseSmart = (imageData, options) => new Promise((resolve, reject) => {
    var imageSize = {
        width: imageData.width,
        height: imageData.height
    };

    var cropOptions = {
        ...imageSize,
        minScale: imageData.minScale
    }

    if (imageData.boost.length > 0) {
        cropOptions.boost = imageData.boost;
    }
    else if (imageData.facesBoost.length > 0) {
        cropOptions.boost = imageData.facesBoost;
    }

    smartcrop.crop(options.baseDir + imageData.path, cropOptions)
        .then(result => {
            var s = sharp(options.baseDir + imageData.path)
                .extract({
                    width: result.topCrop.width,
                    height: result.topCrop.height,
                    left: result.topCrop.x,
                    top: result.topCrop.y
                })
                .resize(imageSize)
                .toFormat(imageData.format, { quality: imageData.quality });

            if (imageData.sharpen > 0) {
                s.sharpen({ sigma: imageData.sharpen });
            }

            s.toBuffer()
                .then(data => resolve({ data, imageData }))
                .catch(reject);
        })
        .catch(reject);
});

const parsePosition = (imageData, options) => new Promise((resolve, reject) => {
    var s = sharp(options.baseDir + imageData.path)
        .resize({
            width: imageData.width,
            height: imageData.height,
            position: getPosition(imageData.position),
            fit: imageData.fit
        })
        .toFormat(imageData.format, { quality: imageData.quality });

    if (imageData.sharpen > 0) {
        s.sharpen({ sigma: imageData.sharpen });
    }

    s.toBuffer()
        .then(data => resolve({ data, imageData }))
        .catch(reject);
});

const getPosition = pos => {
    if (pos === 'entropy') {
        return sharp.strategy.entropy;
    }
    else if (pos === 'attention') {
        return sharp.strategy.attention;
    }
    else {
        // rightTop -> right top
        return pos.split(/(?=[A-Z])/).join(' ').toLowerCase();
    }
};
