# smarter-sharp

To build docker container:
```
docker build --no-cache -t caprionlinesrl/smarter-sharp:0.1.0 -t caprionlinesrl/smarter-sharp:latest .
```

To run the container:
```
docker run --rm -it -p 3003:3003 caprionlinesrl/smarter-sharp:latest
```
