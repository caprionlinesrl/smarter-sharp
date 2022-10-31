//import '@tensorflow/tfjs-node';
import * as canvas from 'canvas';
import * as faceapi from 'face-api.js';
import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

export const parseFaces = (imageData, options) => new Promise((resolve, reject) => {
    var img = new Image();

    img.onload = () => {
        console.log(img);

        faceapi.nets.tinyFaceDetector.loadFromDisk(path.join(__dirname, 'faceapi'))
            .then(
                () => faceapi.tinyFaceDetector(img),
                err => reject(err)
            )
            .then(
                faces => {
                    console.log(faces);

                    imageData.facesBoost = faces.map(face => {
                        return {
                            x: face.box.x,
                            y: face.box.y,
                            width: face.box.width,
                            height: face.box.height,
                            weight: 1.0
                        };
                    });

                    resolve(imageData);
                },
                err => reject(err)
        );
    };

    img.src = options.baseDir + imageData.path;
});
