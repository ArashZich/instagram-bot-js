FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
# برای استفاده در محیط پروداکشن: RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]