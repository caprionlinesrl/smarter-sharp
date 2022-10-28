import url from 'url';
import sharp from 'sharp';
import smartcrop from 'smartcrop-sharp';

export const parseUrl = (imageUrl, options) => new Promise((resolve, reject) => {
    var result = {
        path: '',
        width: 0,
        height: 0,
        shortSide: 0,
        longSide: 0,
        format: 'jpeg',
        position: 'smart'
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

    var parsedUrl = url.parse(imageUrl);

    result.path = decodeURI(parsedUrl.pathname);

    if (parsedUrl.query) {
        parsedUrl.query.split('&').forEach(arg => {
            var [name, value] = arg.split('=');

            if (name === 'format' && formats.includes(value)) {
                result.format = value;
            }
            else if (name === 'position' && positions.includes(value)) {
                result.position = value;
            }
            else if (['width', 'height', 'shortSide', 'longSide'].includes(name)) {
                result[name] = parseInt(value);
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

export const parseSmart = (imageData, options) => new Promise((resolve, reject) => {
    var imageSize = {
        width: imageData.width,
        height: imageData.height
    };

    smartcrop.crop(options.baseDir + imageData.path, imageSize)
        .then(result => {
            sharp(options.baseDir + imageData.path)
                .extract({
                    width: result.topCrop.width,
                    height: result.topCrop.height,
                    left: result.topCrop.x,
                    top: result.topCrop.y
                })
                .resize(imageSize)
                .toFormat(imageData.format)
                .toBuffer()
                .then(data => resolve({ data, imageData }))
                .catch(reject);
        })
        .catch(reject);
});

export const parsePosition = (imageData, options) => new Promise((resolve, reject) => {
    sharp(options.baseDir + imageData.path)
        .resize({
            width: imageData.width,
            height: imageData.height,
            position: _getPosition(imageData.position)
        })
        .toFormat(imageData.format)
        .toBuffer()
        .then(data => resolve({ data, imageData }))
        .catch(reject);
});

const _getPosition = pos => {
    if (pos === 'entropy') {
        return sharp.strategy.entropy;
    }
    else if (pos === 'attention') {
        return sharp.strategy.attention;
    }
    else {
        return pos.split(/(?=[A-Z])/).join(' ').toLowerCase();
    }
};