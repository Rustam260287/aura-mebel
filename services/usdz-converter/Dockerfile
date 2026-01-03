# syntax=docker/dockerfile:1

FROM python:3.11-slim-bookworm

ARG BLENDER_VERSION=3.6.12
ARG BLENDER_MAJOR_MINOR=3.6

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    xz-utils \
    libx11-6 \
    libxi6 \
    libxxf86vm1 \
    libxrender1 \
    libxrandr2 \
    libxfixes3 \
    libxext6 \
    libsm6 \
    libgl1 \
    libegl1 \
    libdbus-1-3 \
    libglib2.0-0 \
    libfreetype6 \
    libfontconfig1 \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /opt \
  && curl -fsSL "https://download.blender.org/release/Blender${BLENDER_MAJOR_MINOR}/blender-${BLENDER_VERSION}-linux-x64.tar.xz" -o /tmp/blender.tar.xz \
  && tar -xf /tmp/blender.tar.xz -C /opt \
  && rm /tmp/blender.tar.xz \
  && ln -sf "/opt/blender-${BLENDER_VERSION}-linux-x64/blender" /usr/local/bin/blender

WORKDIR /app

COPY services/usdz-converter/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY services/usdz-converter/app.py /app/app.py
COPY scripts/convert_glb_to_usdz.py /app/convert_glb_to_usdz.py

ENV PORT=8080
ENV BLENDER_BIN=blender
ENV BLENDER_USDZ_SCRIPT=/app/convert_glb_to_usdz.py

EXPOSE 8080

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "4", "--timeout", "900", "app:app"]

