# `infra/docker/latency-echo/`

- **Owner:** backend developer
- **Status:** Prepared — T-019 (never run by agents)

## Role

Temporary image of the latency probe server, deployed by the owner in each candidate region for spike SP4, then destroyed.

```bash
docker build -f infra/docker/latency-echo/Dockerfile -t skyline/latency-echo:0.1 .
docker run --rm -p 8080:8080 -e PROBE_REGIONS='[...]' skyline/latency-echo:0.1
```
Put it behind TLS (`wss://`) when exposed on the Internet.
