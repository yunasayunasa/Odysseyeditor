// src/scenes/BaseGameScene.js (最終確定・完成版)

export default class BaseGameScene extends Phaser.Scene {

     /**
     * 汎用初期化ルーチン（async/await版）
     */
   applyLayoutAndPhysics() {
        const sceneKey = this.scene.key;

        // ★★★ 変更点: ロード処理を完全に削除 ★★★
        // データはPreloadSceneでロード済みなので、直接キャッシュから取得する
        const layoutData = this.cache.json.get(sceneKey);
        
        // buildSceneFromLayoutを即座に呼び出す
        this.buildSceneFromLayout(layoutData);
        this.finalizeSetup();
    }


    /**
     * 読み込み済みのレイアウトデータを使って、シーンを構築する
     */
  // src/scenes/BaseGameScene.js

    buildSceneFromLayout(layoutData) {
        const sceneKey = this.scene.key;

        // --- ログ爆弾フェーズ1: メソッド開始とデータチェック ---
        console.log(`💣💥 FINAL BOMB - PHASE 1: buildSceneFromLayout called for '${sceneKey}'`);
        if (!layoutData || !layoutData.objects || layoutData.objects.length === 0) {
            console.warn(`💣💥 BOMB INFO: No layout objects found for '${sceneKey}'. Skipping build.`);
            this.finalizeSetup();
            return;
        }

        console.log(`💣 Found ${layoutData.objects.length} objects to process.`);

        const createdObjects = [];
        try {
            // --- ログ爆弾フェーズ2: オブジェクト生成ループの監視 ---
            console.log("💣💥 FINAL BOMB - PHASE 2: Starting object creation loop...");
            for (let i = 0; i < layoutData.objects.length; i++) {
                const layout = layoutData.objects[i];
                console.log(`💣 Processing object [${i+1}/${layoutData.objects.length}]: name='${layout.name}', type='${layout.type || 'Image'}'`);
                
                const gameObject = this.createObjectFromLayout(layout);
                
                if (gameObject) {
                    console.log(`  -> SUCCESS: GameObject created.`);
                    createdObjects.push({ gameObject, layout });
                } else {
                    console.warn(`  -> WARN: createObjectFromLayout returned null or undefined for '${layout.name}'.`);
                }
            }
            console.log("💣💥 FINAL BOMB - PHASE 2: Object creation loop FINISHED.");

            // --- ログ爆弾フェーズ3: プロパティ適用ループの監視 ---
            console.log("💣💥 FINAL BOMB - PHASE 3: Starting property application loop...");
            for (let i = 0; i < createdObjects.length; i++) {
                const item = createdObjects[i];
                console.log(`💣 Applying properties to [${i+1}/${createdObjects.length}]: '${item.layout.name}'`);
                this.applyProperties(item.gameObject, item.layout);
            }
            console.log("💣💥 FINAL BOMB - PHASE 3: Property application loop FINISHED.");
            
        } catch (error) {
            // --- ログ爆弾フェーズ ERROR: 予期せぬエラーの捕捉 ---
            console.error("💣💥 FATAL ERROR during buildSceneFromLayout loop!", error);
            // エラーが発生しても、フリーズさせないためにfinalizeSetupを呼ぶ（デバッグ目的）
            this.finalizeSetup();
            return;
        }

        // --- ログ爆弾フェーズ4: finalizeSetupの呼び出し ---
        console.log("💣💥 FINAL BOMB - PHASE 4: Calling finalizeSetup...");
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
        // ★★★ 変更点: ここでまず、全オブジェクトを編集可能にする ★★★
        const editor = this.plugins.get('EditorPlugin');
        if (editor) {
            this.children.list.forEach(child => {
                if (child.list) {
                    child.list.forEach(c => editor.makeEditable(c, this));
                }
                editor.makeEditable(child, this);
            });
        }
        
        // ★★★ 変更点: 次に、子シーンのカスタムセットアップを呼び出す ★★★
        if (this.onSetupComplete) {
            this.onSetupComplete();
        }

        // 最後に準備完了を通知
        this.events.emit('scene-ready');
        console.log(`[${this.scene.key}] Setup complete. Scene is ready.`);
    }
}

