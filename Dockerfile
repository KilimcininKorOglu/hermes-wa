# ============================================
# Stage 1: Build
# ============================================
FROM golang:1.24-bookworm AS builder

WORKDIR /src

# Install CGO build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Cache Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build
COPY . .

ENV CGO_ENABLED=1
RUN go build -ldflags "-s -w" -o /out/hermeswa .
RUN go build -ldflags "-s -w" -o /out/worker ./cmd/worker/

# ============================================
# Stage 2: Runtime
# ============================================
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binaries
COPY --from=builder /out/hermeswa /app/hermeswa
COPY --from=builder /out/worker /app/worker

# Copy static assets
COPY uploads/ /app/uploads/
COPY .env.example /app/.env.example

# Create uploads directory for runtime
RUN mkdir -p /app/uploads/avatars /app/uploads/system

EXPOSE 2121

CMD ["./hermeswa"]
