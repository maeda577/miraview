# 開発関係のメモ

## 開発方針

* mirakcの標準機能を出来るだけサポートする
* mirakcの内蔵Webサーバで動かす
* mirakcの標準機能で出来ないことは基本諦める
    * スケジュール予約録画など
    * 仮に作る場合でもオプション扱いにして必須にはしない

## UIの作り方

* v0系はReactで作っていたが、バニラtypescript + WebComponentsに切り替える
    * React Routerがmirakc内蔵Webサーバで動かせない事に気づいたから
* 勉強のため、極力プレーンな作りにする
    * 流行りのViteは使わない

## APIクライアントのコード

[OpenAPI TypeScript](https://openapi-ts.dev/) で生成されている
```
npx openapi-typescript http://<mirakcのIPアドレス>:40772/api/docs --output ./src/ts/types/mirakc.d.ts
```

## デモ版
Github pagesで提供したい
