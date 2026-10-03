ARG NODE_IMAGE
FROM scratch AS context_audit
COPY . /

FROM ${NODE_IMAGE} AS npm_base
WORKDIR /app
COPY package.json ./package.json
RUN npm install --global "npm@$(node -p 'require("./package.json").packageManager.split("@")[1]')" --no-audit --no-fund

FROM npm_base AS builder

COPY package.json package-lock.json ./
COPY packages/app/package.json ./packages/app/package.json
COPY packages/storefront/package.json ./packages/storefront/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY scripts/rebuild-native.mjs ./scripts/rebuild-native.mjs
RUN npm ci --no-audit --no-fund

COPY packages/storefront/ ./packages/storefront/
COPY scripts/run-storefront.mjs ./scripts/run-storefront.mjs
COPY scripts/catalog-seed/seed-config.json ./scripts/catalog-seed/seed-config.json
RUN npm run build

FROM npm_base AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages/app/package.json ./packages/app/package.json
COPY packages/storefront/package.json ./packages/storefront/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN npm ci --workspace=storefront --include-workspace-root=false --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force

COPY --from=builder /app/packages/storefront/dist ./packages/storefront/dist
COPY --from=builder /app/packages/storefront/app/lib ./packages/storefront/app/lib
COPY --from=builder /app/packages/storefront/server.node.ts ./packages/storefront/server.node.ts

USER node
CMD ["node", "packages/storefront/server.node.ts"]
