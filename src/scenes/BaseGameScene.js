// src/scenes/BaseGameScene.js (新規作成)

export default class BaseGameScene extends Phaser.Scene {

    /**
     * 汎用初期化ルーチン：シーンキーと同じ名前のJSONデータを読み込み、
     * シーンのレイアウトと物理を構築する。
     */
    applyLayoutAndPhysics() {
        const sceneKey = this.scene.key;
        console.log(`[${sceneKey}] Applying layout data...`);

        // シーンごとのJSONファイルを動的にロード
        const layoutPath = `assets/data/scenes/${sceneKey}.json`;
        this.load.json(sceneKey, layoutPath);
        
        // ロード完了後の処理を定義
        this.load.once(`filecomplete-json-${sceneKey}`, () => {
            const layoutData = this.cache.json.get(sceneKey);
            
            if (!layoutData || !layoutData.objects) {
                console.warn(`[${sceneKey}] No layout data found in ${layoutPath}. Finalizing setup.`);
                this.finalizeSetup();
                return;
            }

            console.log(`[${sceneKey}] Found ${layoutData.objects.length} objects to layout.`);
            
            for (const layout of layoutData.objects) {
                // オブジェクトを生成・配置 (この部分は、シーンごとにオーバーライド可能)
                this.createObjectFromLayout(layout);
            }
            
            // 最後に、シーン固有の最終セットアップを呼び出す
            this.finalizeSetup();
        });

        // ロード処理を開始
        this.load.start();
    }

    /**
     * 単一のレイアウト定義から、ゲームオブジェクトを生成・設定する。
     * このメソッドは、子シーン（GameSceneなど）でオーバーライドされることを想定。
     */
    createObjectFromLayout(layout) {
        // デフォルトでは、Imageオブジェクトを生成
        const gameObject = this.add.image(layout.x, layout.y, layout.texture || layout.name.split('_')[0]);
        gameObject.name = layout.name;

        // Transformプロパティを適用
        gameObject.setPosition(layout.x, layout.y);
        gameObject.setScale(layout.scaleX, layout.scaleY);
        gameObject.setAngle(layout.angle);
        gameObject.setAlpha(layout.alpha);

        // 物理プロパティを適用
        if (layout.physics) {
            this.physics.add.existing(gameObject, layout.physics.isStatic);
            if (gameObject.body) {
                const phys = layout.physics;
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
        
        return gameObject;
    }

    /**
     * レイアウト適用後に行う、シーンの最終セットアップ。
     * 子シーンでオーバーライドされることを想定。
     */
    finalizeSetup() {
        // ★★★ 開発の5ヶ条: 第1条 ★★★
        this.events.emit('scene-ready');
        console.log(`[${this.scene.key}] Setup complete. Scene is ready.`);
    }
}