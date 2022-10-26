import url from 'url';
import sharp from 'sharp';
import smartcrop from 'smartcrop-sharp';

class ImageParser
{
    constructor(options)
    {
        this.options = options;

        if (this.options.basedir === undefined) {
            this.options.basedir = '';
        }
    }

    parse(image_url, onSuccess, onFailure)
    {
        

        this._parseUrl(image_url, onFailure, args => {
            if (args.position === 'smart') {
                this._parseSmart(args, onSuccess, onFailure);
            }
            else {
                this._parsePosition(args, onSuccess, onFailure);
            }
        });
    }

    _parseUrl(image_url, onFailure, callback)
    {
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

        var parsed_url = url.parse(image_url);

        result.path = decodeURI(parsed_url.pathname);

        if (parsed_url.query) {
            parsed_url.query.split('&').forEach(arg => {
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

        sharp(this.options.basedir + result.path)
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

                callback(result);
            })
            .catch(err => onFailure(err, result));
    }

    _parseSmart(args, onSuccess, onFailure)
    {
        smartcrop.crop(this.options.basedir + args.path, { width: args.width, height: args.height })
            .then(result => {
                sharp(this.options.basedir + args.path)
                    .extract({
                        width: result.topCrop.width,
                        height: result.topCrop.height,
                        left: result.topCrop.x,
                        top: result.topCrop.y
                    })
                    .resize({
                        width: args.width,
                        height: args.height
                    })
                    .toFormat(args.format)
                    .toBuffer()
                    .then(data => onSuccess(data, args))
                    .catch(err => onFailure(err, args));
            })
            .catch(err => onFailure(err));
    }

    _parsePosition(args, onSuccess, onFailure)
    {
        sharp(this.options.basedir + args.path)
            .resize({
                width: args.width,
                height: args.height,
                position: this._getPosition(args.position)
            })
            .toFormat(args.format)
            .toBuffer()
            .then(data => onSuccess(data, args))
            .catch(err => onFailure(err, args));
    }

    _getPosition(pos)
    {
        if (pos === 'entropy') {
            return sharp.strategy.entropy;
        }
        else if (pos === 'attention') {
            return sharp.strategy.attention;
        }
        else {
            return pos.split(/(?=[A-Z])/).join(' ').toLowerCase()
        }
    }
}

export default ImageParser;
