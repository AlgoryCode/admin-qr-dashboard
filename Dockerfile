# syntax=docker/dockerfile:1

# Production servers (Coolify/x86_64): linux/amd64
# Mac build: docker build --platform linux/amd64 ...
ARG TARGETPLATFORM=linux/amd64

FROM --platform=$TARGETPLATFORM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG API_BASE_URL=/api
ARG API_PROXY_TARGET=https://prod.qrapi.algorycode.com
ARG NEXT_PUBLIC_MEMBER_APP_URL=https://qr.algorycode.com
ENV API_BASE_URL=$API_BASE_URL
ENV API_PROXY_TARGET=$API_PROXY_TARGET
ENV NEXT_PUBLIC_MEMBER_APP_URL=$NEXT_PUBLIC_MEMBER_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
