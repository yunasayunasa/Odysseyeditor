// src/scenes/BaseGameScene.js

export default class BaseGameScene extends Phaser.Scene {

    /**
     * 汎用初期化ルーチン：シーンキーと同じ名前のJSONデータを読み込み、
     * シーンのレイアウトと物理を構築する。
     */
    applyLayoutAndPhysics() {
        const sceneKey = this.scene.key;
        const layoutPath = `assets/data/scenes/${sceneKey}.json`;

        // JSONファイルの存在チェック
        if (this.cache.json.has(sceneKey)) {
             this.buildSceneFromLayout(sceneKey);
        } else {
            this.load.json(sceneKey, layoutPath);
            this.load.once(`filecomplete-json-${sceneKey}`, () => {
                this.buildSceneFromLayout(sceneKey);
            });
            this.load.start();
        }
    }

    /**
     * ★★★ 新規メソッド ★★★
     * 読み込み済みのレイアウトデータを使って、シーンを構築する
     */
    buildSceneFromLayout(sceneKey) {
        const layoutData = this.cache.json.get(sceneKey);
        if (!layoutData || !layoutData.objects) {
            console.warn(`[${sceneKey}] Layout data is empty or invalid.`);
            this.finalizeSetup();
            return;
        }

        console.log(`[${sceneKey}] Building scene from layout data...`);
        
        for (const layout of layoutData.objects) {
            // ★★★ 変更点1: オブジェクトの「生成」を createObjectFromLayout に委譲 ★★★
            const gameObject = this.createObjectFromLayout(layout);

            if (gameObject) {
                // ★★★ 変更点2: プロパティの「適用」を applyProperties に委譲 ★★★
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
        this.events.emit('scene-ready');
        console.log(`[${this.scene.key}] Setup complete. Scene is ready.`);
    }
}