FROM node:20

WORKDIR /app

COPY package*.json ./

COPY . .

RUN npm install

CMD [ "npm", "start" ]

EXPOSE 8000