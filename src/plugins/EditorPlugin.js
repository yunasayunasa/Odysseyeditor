// src/plugins/EditorPlugin.js

export default class EditorPlugin extends Phaser.Plugins.BasePlugin {
      constructor(pluginManager) {
        super(pluginManager);

        this.selectedObject = null;
        this.isDragging = false;

        // ★★★ 変更点1: 編集可能オブジェクトを管理するMapを追加 ★★★
        // Key: シーンキー (e.g., 'UIScene'), Value: そのシーンの編集可能オブジェクトのSet
        this.editableObjects = new Map();

        this.editorPanel = document.getElementById('editor-panel');
        this.editorTitle = document.getElementById('editor-title');
        this.editorPropsContainer = document.getElementById('editor-props');
    }

      init() {
        console.log('[EditorPlugin] Initialized.');
        if (this.editorPanel) {
            this.editorPanel.style.display = 'block';
        }
        
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ ここが修正箇所です ★★★
        // ★★★ グローバルな 'game.input' ではなく、      ★★★
        // ★★★ シーンの 'input.keyboard' を使います     ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ゲーム起動時にアクティブになっている任意のシーン（通常はPreloadSceneやSystemScene）
        // のキーボードマネージャーを借りて、Pキーのリスナーを登録します。
        // this.scene はプラグイン内では使えないため、pluginManager経由でアクセスします。
        const sceneForKeyboard = this.pluginManager.game.scene.scenes[0]; // 最初に起動したシーンを借りる
        if (sceneForKeyboard) {
            sceneForKeyboard.input.keyboard.on('keydown-P', this.exportLayoutToJson, this);
        } else {
            console.error('[EditorPlugin] Could not find an active scene to attach keyboard listener.');
        }
    }

     /**
     * @param {Phaser.GameObjects.GameObject} gameObject
     * @param {Phaser.Scene} scene
     */
    makeEditable(gameObject, scene) {
        if (!gameObject || !scene || gameObject.getData('isEditable')) return;
        
        gameObject.setInteractive();
        scene.input.setDraggable(gameObject);

        // ★★★ 変更点2: オブジェクトを管理リストに登録 ★★★
        const sceneKey = scene.scene.key;
        if (!this.editableObjects.has(sceneKey)) {
            this.editableObjects.set(sceneKey, new Set());
        }
        this.editableObjects.get(sceneKey).add(gameObject);
        scene.input.setDraggable(gameObject);

        // --- オブジェクトに個別のイベントリスナーを設定 (ここから下は変更なし) ---
      gameObject.on('pointerdown', (pointer) => {
        // ドラッグ操作かどうかを待つ必要はない。
        // クリックされた瞬間に、まずオブジェクトを選択状態にする。
        this.selectedObject = gameObject;
        
        // そして、即座にプロパティパネルを更新する！
        this.updatePropertyPanel();
    });

    // 2. オブジェクトのドラッグが開始された瞬間のイベント
    // (このイベントリスナーは、以前のままでも良いですが、
    //  クリック処理からisDraggingフラグが消えたので、ここもシンプルにします)
    //  このリスナー自体が不要になる場合もありますが、念のため残します。
    gameObject.on('dragstart', (pointer) => {
        // ドラッグが開始されたことを示すログ（デバッグ用）
         console.log('Drag started on:', gameObject.name);
    });
        
        gameObject.on('drag', (pointer, dragX, dragY) => {
            gameObject.x = Math.round(dragX);
gameObject.y = Math.round(dragY);
            if(this.selectedObject === gameObject) this.updatePropertyPanel();
        });
        gameObject.on('pointerover', () => gameObject.setTint(0x00ff00));
        gameObject.on('pointerout', () => gameObject.clearTint());
        gameObject.setData('isEditable', true);
    }
    /**
     * シーンの何もない場所がクリックされた時に、選択を解除するためのメソッド
     * このメソッドは、各シーンの 'pointerdown' イベントから呼び出される
     */
    onScenePointerDown() {
        this.selectedObject = null;
        this.updatePropertyPanel();
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
     * ★★★ 変更点3: exportLayoutToJsonメソッドを完全に書き換える ★★★
     */
    exportLayoutToJson() {
        console.log(`%c--- Exporting Layouts ---`, "color: lightgreen; font-weight: bold;");

        const fullLayoutData = {};

        // 管理しているすべてのシーンに対してループ処理
        for (const [sceneKey, objects] of this.editableObjects.entries()) {
            
            const sceneLayout = {
                objects: []
            };

            // 各シーンの編集可能オブジェクトをループ処理
            for (const gameObject of objects) {
                // オブジェクトが出力に必要な情報を持っているかチェック
                if (gameObject.name) {
                    sceneLayout.objects.push({
                        name: gameObject.name,
                        x: Math.round(gameObject.x),
                        y: Math.round(gameObject.y),
                        scaleX: parseFloat(gameObject.scaleX.toFixed(2)),
                        scaleY: parseFloat(gameObject.scaleY.toFixed(2)),
                        angle: Math.round(gameObject.angle),
                        alpha: parseFloat(gameObject.alpha.toFixed(2)),
                    });
                } else {
                    console.warn(`[EditorPlugin] Object of type ${gameObject.type} has no name and was not exported.`);
                }
            }
            
            // シーンにエクスポート対象のオブジェクトがあれば、最終データに追加
            if (sceneLayout.objects.length > 0) {
                fullLayoutData[sceneKey] = sceneLayout;
            }
        }

        // 最終的なJSONデータを整形してコンソールに出力
        const jsonString = JSON.stringify(fullLayoutData, null, 2);
        console.log(jsonString);

        // (将来的に) クリップボードへのコピー機能
        // navigator.clipboard.writeText(jsonString).then(() => {
        //     console.log('%cLayout JSON copied to clipboard!', 'color: cyan;');
        // });
    }

     // プラグインが終了する時に呼ばれる
    destroy() {
        // ★★★ 修正箇所: リスナーを解除する際も、同じシーンから解除する ★★★
        const sceneForKeyboard = this.pluginManager.game.scene.scenes[0];
         if (sceneForKeyboard) {
            sceneForKeyboard.input.keyboard.off('keydown-P', this.exportLayoutToJson, this);
        }

        if (this.editorPanel) {
            this.editorPanel.style.display = 'none';
        }
        super.destroy();
    }  }