FROM node:24-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/caption-ai/package.json ./artifacts/caption-ai/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY lib/integrations/package.json ./lib/integrations/
COPY lib/integrations-gemini-ai/package.json ./lib/integrations-gemini-ai/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
ENV NODE_ENV=production
RUN BASE_PATH=/ pnpm --filter @workspace/caption-ai run build
RUN pnpm --filter @workspace/api-server run build

FROM node:24-alpine AS runner
RUN npm install -g pnpm@9
WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/caption-ai/package.json ./artifacts/caption-ai/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY lib/integrations/package.json ./lib/integrations/
COPY lib/integrations-gemini-ai/package.json ./lib/integrations-gemini-ai/
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=build /app/artifacts/caption-ai/dist ./artifacts/caption-ai/dist

EXPOSE 8080
ENV PORT=8080

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
