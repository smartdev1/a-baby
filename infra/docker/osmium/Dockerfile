# Role: frozen OSM tool image used by the map pipeline (osmium extract/export, GDAL for the DEM) on Windows and Linux.
# Base image pinned by digest and every tool pinned by Debian version: rebuilding gives the same tools.
FROM debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f

RUN apt-get update \
 && apt-get install -y --no-install-recommends osmium-tool=1.18.0-1 gdal-bin=3.10.3+dfsg-1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /data
ENTRYPOINT ["osmium"]
