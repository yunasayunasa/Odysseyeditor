// src/scenes/EditorScene.js (最終アーキテクチャ・完全版)

export default class EditorScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EditorScene' });
        this.selectedObject = null;
        this.editorPanel = null;
        this.editorTitle = null;
        this.editorPropsContainer = null;
    }

    create() {
        console.log("[EditorScene] Created and brought to top.");
        // このシーンを常に最前面に描画する
        this.scene.bringToTop();
  this.input.topOnly = false;
        // HTMLパネルの要素を取得・表示
        this.editorPanel = document.getElementById('editor-panel');
        this.editorTitle = document.getElementById('editor-title');
        this.editorPropsContainer = document.getElementById('editor-props');
        if (this.editorPanel) {
            this.editorPanel.style.display = 'block';
        }

        // --- このシーンで、ゲーム全体の入力を一元的にリッスンする ---

        // オブジェクトがクリックされた時の処理
         this.input.on('pointerdown', (pointer) => {
            const hitObjects = this.input.hitTest(pointer, this.getAllGameObjects(), pointer.camera);
            
            if (hitObjects.length > 0) {
                // オブジェクトにヒットした場合
                this.selectedObject = hitObjects[0]; // 最も手前のオブジェクトを選択
                this.updatePropertyPanel();
            } else {
                // 何にもヒットしなかった場合
                this.selectedObject = null;
                this.updatePropertyPanel();
            }
        });

        
        // オブジェクトがドラッグされている間の処理
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            // オブジェクトの座標を更新
            gameObject.x = Math.round(dragX);
            gameObject.y = Math.round(dragY);
            // 選択中のオブジェクトであれば、パネルの表示もリアルタイムに更新
            if (gameObject === this.selectedObject) {
                this.updatePropertyPanel();
            }
        });

      
    }

    /**
     * 現在アクティブな全シーンから、編集可能な（インタラクティブな）オブジェクトをすべて取得するヘルパー関数
     */
    getAllGameObjects() {
        // 現在アクティブなシーンのリストを取得
        const scenes = this.scene.manager.getScenes(true); 
        let allObjects = [];
        
        for (const scene of scenes) {
            // EditorScene自身は検索対象から除外する
            if (scene.scene.key !== 'EditorScene') {
                // 各シーンの表示リスト（children.list）を結果の配列に追加していく
                allObjects = allObjects.concat(scene.children.list);
            }
        }
        return allObjects;
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
}