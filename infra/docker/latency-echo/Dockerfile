# Role: temporary latency probe image (spike SP4) deployed by the owner in each candidate region — echo only, no storage.
# Build from the repository root: docker build -f infra/docker/latency-echo/Dockerfile -t skyline/latency-echo:0.1 .
FROM node:24-alpine
WORKDIR /probe
RUN npm install --no-save ws@8.22.0
COPY tools/latency-probe/src ./src
COPY tools/latency-probe/page ./page
ENV PORT=8080
EXPOSE 8080
USER node
CMD ["node", "src/echo-server.mjs"]
