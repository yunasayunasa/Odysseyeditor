// src/core/EditorManager.js

export default class EditorManager {
    // ★★★ 修正点1: コンストラクタが "game" ではなく "scene" を受け取るように変更 ★★★
    constructor(scene) {
        // game全体ではなく、リスナーを設定するための初期シーンを保持
        this.initialScene = scene;
        
        this.selectedObject = null;

        // HTMLパネルの要素を取得
        this.editorPanel = document.getElementById('editor-panel');
        this.editorTitle = document.getElementById('editor-title');
        this.editorPropsContainer = document.getElementById('editor-props');

        if (this.editorPanel) {
            this.editorPanel.style.display = 'block';
        }

        // ★★★ 修正点2: this.game.input ではなく、受け取った scene.input を使う ★★★
        // これで 'on' is not a function エラーが解決する
        this.initialScene.input.on('gameobjectdown', this.onGameObjectDown, this);
        this.initialScene.input.on('pointerdown', this.onPointerDown, this);
        this.initialScene.input.on('drag', this.onDrag, this);
        
        // キーボード入力はシーンに依存しないので、これはそのままでOK
        this.initialScene.input.keyboard.on('keydown-P', this.exportLayoutToJson, this);
        
        console.log("[EditorManager] Initialized successfully via scene: " + scene.scene.key);
    }

    /**
     * ゲームオブジェクトを編集可能にする
     * @param {Phaser.GameObjects.GameObject} gameObject 
     * @param {Phaser.Scene} scene - オブジェクトが所属するシーン
     */
    makeEditable(gameObject, scene) {
        if (!gameObject || gameObject.isEditable) return;
        
        try {
            gameObject.setInteractive();
            scene.input.setDraggable(gameObject, true);
            
            gameObject.on('pointerover', () => gameObject.setTint(0x00ff00));
            gameObject.on('pointerout', () => gameObject.clearTint());

            gameObject.isEditable = true;
        } catch (e) {
            console.warn(`[EditorManager] Object "${gameObject.name || 'Unnamed Object'}" could not be made interactive. Error:`, e.message);
        }
    }

    // --- 内部イベントハンドラ ---

    onGameObjectDown(pointer, gameObject) {
        this.selectedObject = gameObject;
        this.updatePropertyPanel();
    }

    onPointerDown(pointer) {
        // pointer.camera.scene.children.list を使うことで、クリックされたシーンのオブジェクトのみを対象にできる
        const hitObjects = pointer.camera.scene.input.hitTest(pointer, pointer.camera.scene.children.list, pointer.camera);

        if (hitObjects.length === 0) {
             // どのシーンがクリックされたかに関わらず、選択を解除する
             this.selectedObject = null;
             this.updatePropertyPanel();
        }
    }

    onDrag(pointer, gameObject, dragX, dragY) {
        gameObject.x = Math.round(dragX);
        gameObject.y = Math.round(dragY);
        if (gameObject === this.selectedObject) {
            this.updatePropertyPanel();
        }
    }

   

    /**
     * プロパティ編集パネルの表示を更新する
     */
    updatePropertyPanel() {
        if (!this.editorPanel || !this.editorPropsContainer || !this.editorTitle) return;
        
        this.editorPropsContainer.innerHTML = '';
        
        if (!this.selectedObject) {
            this.editorTitle.innerText = 'No Object Selected';
            this.editorPanel.style.visibility = 'hidden'; 
            return;
        }
        
        this.editorPanel.style.visibility = 'visible';
        this.editorTitle.innerText = `Editing: ${this.selectedObject.name || '(no name)'}`;

        const properties = {
            x: { type: 'number', step: 1 },
            y: { type: 'number', step: 1 },
            scaleX: { type: 'range', min: 0.1, max: 5, step: 0.01 },
            scaleY: { type: 'range', min: 0.1, max: 5, step: 0.01 },
            angle: { type: 'range', min: -180, max: 180, step: 1 },
            alpha: { type: 'range', min: 0, max: 1, step: 0.01 }
        };

        for (const key in properties) {
            if (this.selectedObject[key] === undefined) continue;

            const prop = properties[key];
            const value = this.selectedObject[key];
            
            const row = document.createElement('div');
            row.style.marginBottom = '8px';
            
            const label = document.createElement('label');
            label.innerText = `${key}: `;
            label.style.display = 'inline-block';
            label.style.width = '70px';

            const input = document.createElement('input');
            input.type = prop.type;
            if (prop.min !== undefined) input.min = prop.min;
            if (prop.max !== undefined) input.max = prop.max;
            if (prop.step !== undefined) input.step = prop.step;
            input.value = value;
            input.style.width = '150px';

            input.addEventListener('input', (e) => {
                const newValue = parseFloat(e.target.value);
                if (!isNaN(newValue)) {
                    this.selectedObject[key] = newValue;
                }
            });

            row.appendChild(label);
            row.appendChild(input);
            this.editorPropsContainer.appendChild(row);
        }
    }
    
    /**
     * 現在編集可能な全オブジェクトのレイアウト情報をJSONでコンソールに出力する
     */
    exportLayoutToJson() {
        console.log(`%c--- Exporting Layouts for All Active Scenes ---`, "color: lightgreen; font-weight: bold;");

        const activeScenes = this.game.scene.getScenes(true);
        
        activeScenes.forEach(scene => {
            const exportData = {
                scene: scene.scene.key,
                objects: []
            };

            scene.children.list.forEach(gameObject => {
                // isEditableフラグを持つオブジェクトのみを対象とする
                if (gameObject.isEditable) {
                    exportData.objects.push({
                        name: gameObject.name || `unnamed_${gameObject.type}`,
                        x: Math.round(gameObject.x),
                        y: Math.round(gameObject.y),
                        scaleX: parseFloat(gameObject.scaleX.toFixed(2)),
                        scaleY: parseFloat(gameObject.scaleY.toFixed(2)),
                        angle: Math.round(gameObject.angle),
                        alpha: parseFloat(gameObject.alpha.toFixed(2)),
                    });
                }
            });

            if (exportData.objects.length > 0) {
                console.log(`%c[${scene.scene.key}]`, "color: yellow;");
                console.log(JSON.stringify(exportData, null, 2));
            }
        });
    }

   /**
     * シーンをエディタの管理対象に追加する
     * @param {Phaser.Scene} scene 
     */
    registerScene(scene) {
        this.activeScenes.add(scene);
        console.log(`[EditorManager] Scene registered: ${scene.scene.key}`);
    }

    /**
     * シーンをエディタの管理対象から解除する
     * @param {Phaser.Scene} scene 
     */
    unregisterScene(scene) {
        this.activeScenes.delete(scene);
        console.log(`[EditorManager] Scene unregistered: ${scene.scene.key}`);
    }

    /**
     * ゲーム終了時にイベントリスナーをクリーンアップする
     */
       shutdown() {
        if (!this.initialScene) return;
        
        this.initialScene.input.off('gameobjectdown', this.onGameObjectDown, this);
        this.initialScene.input.off('pointerdown', this.onPointerDown, this);
        this.initialScene.input.off('drag', this.onDrag, this);
        this.initialScene.input.keyboard.off('keydown-P', this.exportLayoutToJson, this);
        
        if (this.editorPanel) {
            this.editorPanel.style.display = 'none';
        }
        console.log("[EditorManager] Shutdown complete.");
    }
}