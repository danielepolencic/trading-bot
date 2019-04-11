## Running locally

```bash
docker run -p 6379:6379 -d --name redis --net=forex redis
```

```bash
docker run -v $PWD:/app -ti --rm --net=forex -p 4000:4000 -e REDIS_URL=redis://redis:6379 node:forex ts-node index.tsx
```

## Inspecting redis

```bash
docker run --net=forex -ti --rm redis bash
```

and once you are logged in:

```bash
redis-cli -h redis
```
