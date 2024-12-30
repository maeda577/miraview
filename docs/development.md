# 開発関係のメモ

## 開発方針

* mirakcの標準機能を出来るだけサポートする
* mirakcの内蔵Webサーバで動かす
* mirakcで出来ないことは基本諦める。作る場合でもオプション扱いにして必須にはしない
    * スケジュール予約録画など

## UIの作り方

* v0系はReactで作っていたが、バニラtypescript + WebComponentsに切り替える
    * React Routerがmirakc内蔵Webサーバで動かせない事に気づいたから
* 勉強のため、極力プレーンな作りにする
    * 流行りのViteは使わず、rollupを直で叩く

## アイコンのソース

* 「Google FontsのIconsのDvr」に色をつけたもの
    * https://fonts.google.com/icons をDvrで検索

Github pagesで提供する
