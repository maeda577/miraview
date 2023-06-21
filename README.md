# miraview

## これは何

mirakc用のWebUIです。html+javascriptで出来ているため、mirakcの内蔵Webサーバ機能で動かすことが可能です。

![デモgif](/docs/demo.gif)

## 機能

以下の機能を持ちます。非常にシンプルです。

* 番組表の表示
* チューナーの使用状況の表示
* mirakcバージョンの表示

## インストール方法

以下は一例です。ただのhtmlなので、mirakcが読める場所に配置できれば動きます。別ホストにApache等を入れても動かせますが、CORS周りで色々面倒なのでお勧めしません。

### 手順1 docker-compose.yml編集

mirakcはdocker-compose経由で導入されているはずなので、そのcomposeファイルを編集してください。仮に[mirakcリポジトリにあるdocker-compose.ymlサンプル](https://github.com/mirakc/mirakc)をそのまま使用しているとして、以下の追加1-3を加えてください。

``` yaml
version: '3'

services:
  mirakc:
    image: docker.io/mirakc/mirakc:alpine
    container_name: mirakc
    init: true
    restart: unless-stopped
    devices:
      # Add device files used in `tuners[].command`.
      - /dev/px4video2
    ports:
      - 40772:40772
    volumes:
      - mirakc-epg:/var/lib/mirakc/epg
      - ./config.yml:/etc/mirakc/config.yml:ro
# 追加1 ここから
      - miraview-html:/var/www/miraview:ro
# 追加1 ここまで
    environment:
      TZ: Asia/Tokyo
      RUST_LOG: info
# 追加2 ここから
  miraview:
    image: docker.io/mirakc/mirakc:alpine
    container_name: miraview-loader
    restart: "no"
    volumes:
      - miraview-html:/var/www/miraview
    working_dir: /var/www/miraview
    environment:
      MIRAVIEW_VERSION: v0.1.1    # ここのバージョンは適宜変更
    entrypoint: ash
    command: -c "curl -L https://github.com/maeda577/miraview/releases/download/$$MIRAVIEW_VERSION/build.tar.gz | tar -zxvf -"
# 追加2 ここまで

volumes:
  mirakc-epg:
    name: mirakc_epg
    driver: local
# 追加3 ここから
  miraview-html:
    name: miraview_html
    driver: local
# 追加3 ここまで
```

### 手順2 config.yml編集

上と同様に[mirakcリポジトリにあるconfig.ymlサンプル](https://github.com/mirakc/mirakc)をそのまま使用しているとして、以下の追加1を加えてください。

``` yaml
epg:
  cache-dir: /var/lib/mirakc/epg

server:
  addrs:
    - !http '0.0.0.0:40772'
# 追加1 ここから
  mounts:
    /miraview:
      path: /var/www/miraview
      index: index.html
# 追加1 ここまで

# 以下省略
```

### 手順3 再読み込み

`docker-compose.yml` があるディレクトリで `sudo docker compose down` してから `sudo docker compose up -d` してください。mirakcも一度落ちるので、録画中でないことを確認しておいてください。

その後 http://[mirakcが動いているIPアドレス]:[ポート]/miraview/index.html へアクセスするとmiraviewが開くはずです。

## URLプロトコルハンドラの設定

* [macOS用URLプロトコルハンドラの設定](./docs/mac-url.md)
* windows向けは今後作成

## 使用するAPI

以下のAPIを使用しています。試していませんが、Mirakurun互換のものしか使用していないのでMirakurunでも動作すると思います。

* /api/programs
* /api/services
* /api/services/{id}/stream
* /api/tuners
* /api/version
