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
      buildSceneFromLayout(layoutData) {
        const sceneKey = this.scene.key;
        if (!layoutData || !layoutData.objects) {
            this.finalizeSetup();
            return;
        }

        console.log(`[${sceneKey}] Building scene from layout data...`);
        
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ これが最後のアーキテクチャ修正です ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

        // 1. まず、JSONに基づいて全てのオブジェクトを「生成」だけして、配列に溜め込む
        const createdObjects = [];
        for (const layout of layoutData.objects) {
            const gameObject = this.createObjectFromLayout(layout);
            if (gameObject) {
                // 親子関係が壊れないように、プロパティ適用は後回し
                createdObjects.push({ gameObject, layout });
            }
        }
        
        // 2. 全てのオブジェクトが生成され、親子関係が確定した後で、プロパティを「適用」する
        for (const item of createdObjects) {
            this.applyProperties(item.gameObject, item.layout);
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
