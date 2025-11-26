FROM golang:1.23-alpine AS build

WORKDIR /app

# Update Alpine packages for security
RUN apk update && apk upgrade && apk add --no-cache ca-certificates

COPY go.mod go.sum* ./
RUN go mod download || true

COPY . .

RUN go build -o /trivy-dashboard-backend ./...

FROM alpine:3.21 AS runtime

WORKDIR /app

# Update Alpine packages and install security updates
RUN apk update && apk upgrade && apk add --no-cache ca-certificates tzdata && \
    rm -rf /var/cache/apk/*

COPY --from=build /trivy-dashboard-backend /usr/local/bin/trivy-dashboard-backend

EXPOSE 8080

CMD ["trivy-dashboard-backend"]


