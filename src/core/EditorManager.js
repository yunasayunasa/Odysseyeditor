// src/core/EditorManager.js

export default class EditorManager {
    constructor(game) {
        this.game = game;
        this.selectedObject = null;

        // HTMLパネルの要素を取得
        this.editorPanel = document.getElementById('editor-panel');
        this.editorTitle = document.getElementById('editor-title');
        this.editorPropsContainer = document.getElementById('editor-props');

        if (this.editorPanel) {
            this.editorPanel.style.display = 'block';
        }

        // --- ゲーム全体で一度だけ、グローバルな入力リスナーを設定 ---
        this.game.input.on('gameobjectdown', this.onGameObjectDown, this);
        this.game.input.on('pointerdown', this.onPointerDown, this);
        this.game.input.on('drag', this.onDrag, this);
        this.game.input.keyboard.on('keydown-P', this.exportLayoutToJson, this);
        
        console.log("[EditorManager] Initialized successfully.");
    }

    /**
     * ゲームオブジェクトを編集可能にする
     * @param {Phaser.GameObjects.GameObject} gameObject 
     * @param {Phaser.Scene} scene - オブジェクトが所属するシーン
     */
    makeEditable(gameObject, scene) {
        if (!gameObject || gameObject.isEditable) return;
        
        try {
            // gameObject.setInteractive() は、当たり判定の形状を自動で設定しようとします。
            // コンテナやカスタムクラスの場合、サイズが設定されていないとエラーになることがあります。
            // その場合は、手動でサイズを指定する必要があります。
            // 例: gameObject.setSize(width, height).setInteractive();
            gameObject.setInteractive();

            scene.input.setDraggable(gameObject, true);
            
            gameObject.on('pointerover', () => gameObject.setTint(0x00ff00));
            gameObject.on('pointerout', () => gameObject.clearTint());

            gameObject.isEditable = true; // 二重登録防止フラグ
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
        // 現在ポインター下にあるオブジェクトのリストを取得
        const hitObjects = this.game.input.hitTest(pointer, this.game.scene.getScenes(true).flatMap(scene => scene.children.list));
        
        // どのオブジェクトにもヒットしなかった場合、選択を解除
        if (hitObjects.length === 0) {
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
     * ゲーム終了時にイベントリスナーをクリーンアップする
     */
    shutdown() {
        this.game.input.off('gameobjectdown', this.onGameObjectDown, this);
        this.game.input.off('pointerdown', this.onPointerDown, this);
        this.game.input.off('drag', this.onDrag, this);
        this.game.input.keyboard.off('keydown-P', this.exportLayoutToJson, this);
        
        if (this.editorPanel) {
            this.editorPanel.style.display = 'none';
        }
        console.log("[EditorManager] Shutdown complete.");
    }
}