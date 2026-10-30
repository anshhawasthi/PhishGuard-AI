FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY trained_models/ ./trained_models/
COPY datasets/ ./datasets/
COPY data/ ./data/

EXPOSE 8000
CMD ["node", "dist/server.js"]
