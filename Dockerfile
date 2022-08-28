FROM docker.io/library/node:slim AS builder
WORKDIR /miraview
COPY . .
RUN npm install && npm run build

# miraview単体で使う人がいるとは思えないが、一応単体で動くようにする
FROM docker.io/library/node:slim
COPY --from=builder /miraview/build /var/www/miraview
RUN npm install --global serve
CMD ["serve", "--no-clipboard", "/var/www/miraview"]
