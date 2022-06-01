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
        this._parseUrl(image_url, onFailure, img => {
            if (img.position === 'smart') {
                this._parseSmart(img, onSuccess, onFailure);
            }
            else {
                this._parsePosition(img, onSuccess, onFailure);
            }
        });
    }

    _parseUrl(image_url, onFailure, callback)
    {
        var result = {
            path: '',
            format: 'jpeg',
            width: 0,
            height: 0,
            position: 'smart'
        };

        var url_path_name = url.parse(image_url).pathname;
        var parts = url_path_name.split('/');
        var image_name = parts.pop();
        var options = parts.pop();

        result.path = this.options.basedir + parts.join('/') + '/' + image_name;

        var options_parts = options.split('_');
        var size = options_parts[0];
        var size_parts = size.split('x');

        if (size_parts[0] !== '') {
            result.width = parseInt(size_parts[0]);
        }

        if (size_parts[1] !== undefined) {
            result.height = parseInt(size_parts[1]);
        }

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

        options_parts.forEach(o => {
            if (formats.includes(o)) {
                result.format = o;
            }

            if (positions.includes(o)) {
                result.position = o;
            }
        });

        sharp(result.path)
            .metadata()
            .then(metadata => {
                if (result.height == 0) {
                    result.height = parseInt(result.width * metadata.height / metadata.width);
                }

                callback(result);
            })
            .catch(err => onFailure(err, result));
    }

    _parseSmart(img, onSuccess, onFailure)
    {
        smartcrop.crop(img.path, { width: img.width, height: img.height })
            .then(result => {
                sharp(img.path)
                    .extract({
                        width: result.topCrop.width,
                        height: result.topCrop.height,
                        left: result.topCrop.x,
                        top: result.topCrop.y
                    })
                    .resize({
                        width: img.width,
                        height: img.height
                    })
                    .toFormat(img.format)
                    .toBuffer()
                    .then(data => onSuccess(data, img))
                    .catch(err => onFailure(err, img));
            })
            .catch(err => onFailure(err));
    }

    _parsePosition(img, onSuccess, onFailure)
    {
        sharp(img.path)
            .resize({
                width: img.width,
                height: img.height,
                position: this._getPosition(img.position)
            })
            .toFormat(img.format)
            .toBuffer()
            .then(data => onSuccess(data, img))
            .catch(err => onFailure(err, img));
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
