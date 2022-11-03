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
        .then(imageOptions => {
            return imageOptions.crop == 'smart'
                ? parseCropSmart(imageOptions, options)
                : parseCropOther(imageOptions, options)
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
        crop: 'smart',
        cropSmartBoost: '',
        quality: 'optimized'
    };

    var formats = [
        'jpeg',
        'png',
        'webp'
    ];

    var crops = [
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
        'leftTop',
        'none'
    ];

    var qualities = [
        'optimized',
        'balanced',
        'high'
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
            else if (name === 'crop' && crops.includes(value)) {
                result.crop = value;
            }
            else if (name === 'cropSmartBoost') {
                const boost = value.split(',');

                result.cropSmartBoost = [{
                    x: boost[0] ?? 0,
                    y: boost[1] ?? 0,
                    width: boost[2] ?? 0,
                    height: boost[3] ?? 0,
                    weight: 1
                }];
            }
            else if (name === 'quality' && qualities.includes(value)) {
                result.quality = value;
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

const parseCropSmart = (imageOptions, options) => new Promise((resolve, reject) => {
    var size = {
        width: imageOptions.width,
        height: imageOptions.height
    };

    smartcrop.crop(options.baseDir + imageOptions.path, size)
        .then(result => {
            var image = sharp(options.baseDir + imageOptions.path)
                .extract({
                    width: result.topCrop.width,
                    height: result.topCrop.height,
                    left: result.topCrop.x,
                    top: result.topCrop.y
                })
                .resize(size);

            optimise(image, imageOptions);
        
            image.toBuffer()
                .then(imageData => resolve({ imageData, imageOptions }))
                .catch(reject);
        })
        .catch(reject);
});

const parseCropOther = (imageOptions, options) => new Promise((resolve, reject) => {
    var image = sharp(options.baseDir + imageOptions.path);

    if (imageOptions.crop == 'none') {
        image.resize({
            width: imageOptions.width,
            height: imageOptions.height,
            fit: 'contain'
        });
    }
    else {
        image.resize({
            width: imageOptions.width,
            height: imageOptions.height,
            position: getPosition(imageOptions.crop)
        });
    }

    optimise(image, imageOptions);

    image.toBuffer()
        .then(imageData => resolve({ imageData, imageOptions }))
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

const optimise = (image, imageOptions) => {
    optimiseSharpen(image, imageOptions);

    if (imageOptions.format == 'jpeg') {
        console.log('jpeg');
        optimiseJpeg(image, imageOptions);
    }
    else if (imageOptions.format == 'webp') {
        optimiseWebp(image, imageOptions);
    }
    else if (imageOptions.format == 'png') {
        optimisePng(image, imageOptions);
    }
};

const optimiseSharpen = (image, imageOptions) => {
    //image.sharpen({ sigma: imageOptions.sharpen });
};

const optimiseJpeg = (image, imageOptions) => {
    if (imageOptions.quality == 'optimized') {
        image.jpeg({
            quality: 70,
            mozjpeg: true
        });
    }
    else if (imageOptions.quality == 'balanced') {
        image.jpeg({
            quality: 80
        });
    }
    else if (imageOptions.quality == 'high') {
        image.jpeg({
            quality: 88
        });
    }
};

const optimiseWebp = (image, imageOptions) => {
    image.webp();
};

const optimisePng = (image, imageOptions) => {
    image.png();
};
