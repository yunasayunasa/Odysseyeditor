// src/scenes/BaseGameScene.js (最終確定・完成版)

export default class BaseGameScene extends Phaser.Scene {

    /**
     * 汎用初期化ルーチン：シーンキーと同じ名前のJSONデータを読み込み、
     * シーンのレイアウトと物理を構築する。
     */
    applyLayoutAndPhysics() {
        const sceneKey = this.scene.key;
        const layoutPath = `assets/data/scenes/${sceneKey}.json`;

        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ これが 'No layout data found' を解決するロジックです ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        
        // 1. まず、JSONが既にキャッシュに存在するかチェック
        if (this.cache.json.has(sceneKey)) {
            // 2. 存在すれば、次のフレームで構築処理を呼び出す
            //    (シーンの初期化処理が完全に終わるのを待つための安全策)
            this.time.delayedCall(1, () => {
                this.buildSceneFromLayout(sceneKey);
            });
        } else {
            // 3. 存在しなければ、ファイルをロードする
            this.load.json(sceneKey, layoutPath);
            // 4. ロードが完了したら、構築処理を呼び出す
            this.load.once(`filecomplete-json-${sceneKey}`, () => {
                this.buildSceneFromLayout(sceneKey);
            });
            // 5. ロードを開始
            this.load.start();
        }
    }

    /**
     * 読み込み済みのレイアウトデータを使って、シーンを構築する
     */
    buildSceneFromLayout(sceneKey) {
        const layoutData = this.cache.json.get(sceneKey);
        if (!layoutData || !layoutData.objects) {
            console.warn(`[${sceneKey}] No layout data found in ${sceneKey}.json. Finalizing setup.`);
            this.finalizeSetup(); // データがなくても最終セットアップは必ず呼ぶ
            return;
        }

        console.log(`[${sceneKey}] Building scene from layout data...`);
        
        for (const layout of layoutData.objects) {
            const gameObject = this.createObjectFromLayout(layout);
            if (gameObject) {
                this.applyProperties(gameObject, layout);
            }
        }
        
        this.finalizeSetup();
    }

    /**
     * 単一のレイアウト定義から、ゲームオブジェクトを「生成」する。
     * このメソッドは、子シーンでオーバーライドされることを想定。
     * @returns {Phaser.GameObjects.GameObject} 生成されたゲームオブジェクト
     */
    createObjectFromLayout(layout) {
        // デフォルトでは、Imageオブジェクトを生成する
        const textureKey = layout.texture || layout.name.split('_')[0];
        const gameObject = this.add.image(layout.x, layout.y, textureKey);
        return gameObject;
    }

    /**
     * ★★★ 新規メソッド (旧applyPhysicsProperties) ★★★
     * 単体のオブジェクトに、JSONから読み込んだプロパティを「適用」する
     */
    applyProperties(gameObject, layout) {
        gameObject.name = layout.name;
        
        // Transformプロパティを適用
        gameObject.setPosition(layout.x, layout.y);
        gameObject.setScale(layout.scaleX, layout.scaleY);
        gameObject.setAngle(layout.angle);
        gameObject.setAlpha(layout.alpha);
if (layout.visible !== undefined) {
            gameObject.setVisible(layout.visible);
        }
        // 物理プロパティを適用
        if (layout.physics) {
            const phys = layout.physics;
            this.physics.add.existing(gameObject, phys.isStatic);
            if (gameObject.body) {
                gameObject.body.setSize(phys.width, phys.height);
                gameObject.body.setOffset(phys.offsetX, phys.offsetY);
                gameObject.body.allowGravity = phys.allowGravity;
                gameObject.body.bounce.setTo(phys.bounceX, phys.bounceY);
                gameObject.body.collideWorldBounds = phys.collideWorldBounds;
            }
        }

        // エディタに登録
        const editor = this.plugins.get('EditorPlugin');
        if (editor) {
            editor.makeEditable(gameObject, this);
        }
    }

   /**
     * レイアウト適用後に行う、シーンの最終セットアップ。
     */
    finalizeSetup() {
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ これが「ホバーで移動できない」を解決するロジックです ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // この時点でシーン内の全てのオブジェクト（JSON由来も、コード由来も）が出揃っているので、
        // それら全てをエディタの管理対象にする
        const editor = this.plugins.get('EditorPlugin');
        if (editor) {
            this.children.list.forEach(child => {
                // コンテナの中身も再帰的にチェック
                if (child.list) {
                    child.list.forEach(c => editor.makeEditable(c, this));
                }
                editor.makeEditable(child, this);
            });
        }

        // シーン固有の最終処理を呼び出す (もしあれば)
        if (this.onSetupComplete) {
            this.onSetupComplete();
        }

        // 最後に準備完了を通知
        this.events.emit('scene-ready');
        console.log(`[${this.scene.key}] Setup complete. Scene is ready.`);
    }
}
