# mac用URLプロトコルハンドラの設定

番組ダイアログの選局ボタンを押した際にVLCを起動するための設定です。EPGStationのドキュメントも参考にしてください。[EPGStation/mac-url-scheme.md at master · l3tnun/EPGStation · GitHub](https://github.com/l3tnun/EPGStation/blob/master/doc/mac-url-scheme.md)

## VLCのインストール

* ブラウザではmpeg2を再生できません。再生のためにVLCをインストールしてください。
    * [オープンソースのベストなプレイヤー VLCメディアプレイヤーのオフィシャルダウンロードです。 - VideoLAN](https://www.videolan.org/vlc/)
* homebrewを導入済みの場合は以下コマンドでもインストール可能です
    * `brew install --cask vlc`
    * [vlc — Homebrew Formulae](https://formulae.brew.sh/cask/vlc)

## URLプロトコルハンドラ用アプリの作成

1. スクリプトエディタを起動し、以下を入力してください
    ``` applescript
    # URLプロトコルハンドラ用の関数を作成
    on open location url_text
        # プロトコルの変換前 miraview側と合わせる
        set protocol_before to "vlc://"
        # プロトコルの変換後 mirakcをhttpsで動かしている場合はhttpsに変更
        set protocol_after to "http://"
        # 渡されたURLのプロトコルを書き換える
        set AppleScript's text item delimiters to protocol_before
        set txt_items to text items of url_text
        set AppleScript's text item delimiters to ""
        set scheme_txt to txt_items as Unicode text
        # VLCを起動する
        tell application "VLC"
            OpenURL protocol_after & scheme_txt
            activate
        end tell
    end open location
    ```
1. ファイル > 書き出す で以下の通り書き出してください
    * ファイルフォーマット: アプリケーション
    * 書き出し名: `miraview.app` など
    * 場所: アプリケーション
1. `/Applications/miraview.app/Contents/Info.plist` に以下の通り追記してください
    * 辿り着けない場合、finderでアプリケーション一覧を開き、書き出したmiraview.appを右クリックし「パッケージの内容を表示」とすると下位のディレクトリに行けます
    ``` xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
        <!-- ここらへんに既存keyがある 中略 -->
        <!-- 追記 ここから -->
        <key>CFBundleURLTypes</key>
        <array>
            <dict>
                <key>CFBundleURLName</key>
                <!-- このCFBundleURLNameの値はユニークならなんでもいい -->
                <string>miraview.vlcscheme</string>
                <key>CFBundleURLSchemes</key>
                <array>
                    <!-- vlc:// のプロトコルに反応するようにする -->
                    <string>vlc</string>
                </array>
            </dict>
        </array>
        <!-- 追記 ここまで -->
    </dict>
    </plist>
    ```
1. ブラウザを再起動し、番組ダイアログの選局ボタンが反応することを確認してください
