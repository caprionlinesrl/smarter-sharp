# smarter-sharp

To develop/test it:
```
docker-compose up
./scripts/shell.sh
npm install
```

```
http://localhost:3003/relax.jpg
http://localhost:3003/relax.jpg?width=300
http://localhost:3003/relax.jpg?height=300
http://localhost:3003/relax.jpg?width=400&height=200
http://localhost:3003/relax.jpg?width=400&height=200&position=center
http://localhost:3003/relax.jpg?width=400&height=200&format=webp
http://localhost:3003/relax.jpg?shortSide=300
http://localhost:3003/relax.jpg?longSide=300
```

To build docker container:
```
docker build --no-cache -t caprionlinesrl/smarter-sharp:0.1.0 -t caprionlinesrl/smarter-sharp:latest .
```

To run the container:
```
docker run --rm -it -p 3003:3003 caprionlinesrl/smarter-sharp:latest
```

To build with buildx:

```
docker buildx build --platform linux/amd64,linux/arm64 --no-cache -t caprionlinesrl/smarter-sharp:0.4.1a -t caprionlinesrl/smarter-sharp:latest . --push
```

To run with qemu:

```
docker run --rm -it -p 3003:3003 --platform arm64 -v /usr/bin/qemu-arm-static:/usr/bin/qemu-arm-static caprionlinesrl/smarter-sharp:0.4.1a
```
