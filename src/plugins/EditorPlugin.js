
export default class EditorPlugin extends Phaser.Plugins.BasePlugin {
    constructor(pluginManager) {
        super(pluginManager);

        this.selectedObject = null;
        this.isDragging = false;
        this.editableObjects = new Map();

        // --- 既存のプロパティパネルの要素取得 ---
        this.editorPanel = document.getElementById('editor-panel');
        this.editorTitle = document.getElementById('editor-title');
        this.editorPropsContainer = document.getElementById('editor-props');
        
        // ★★★ 変更点1: アセット・ブラウザのHTML要素もここで取得しておく ★★★
        this.assetBrowserPanel = document.getElementById('asset-browser');
        this.assetListContainer = document.getElementById('asset-list');
    }

    init() {
        console.log('[EditorPlugin] Initialized.');
        
        // プロパティパネルを表示
        if (this.editorPanel) {
            this.editorPanel.style.display = 'block';
        }
        
        // ★★★ 変更点2: アセット・ブラウザを表示し、中身を構築する ★★★
        if (this.assetBrowserPanel && this.assetListContainer) {
            this.assetBrowserPanel.style.display = 'block'; // 非表示だったパネルを表示する
            
            // --- レジストリからアセットリストを取得 ---
            const assetList = this.pluginManager.game.registry.get('asset_list');
            if (!assetList) {
                console.warn('[EditorPlugin] Asset list not found in registry.');
                return;
            }

            // --- アセットリストに基づいてHTML要素を生成 ---
            // まずは中身を空にする
            this.assetListContainer.innerHTML = '';
            
            // 画像アセットのみをフィルタリング
            const imageAssets = assetList.filter(asset => asset.type === 'image');

            for (const asset of imageAssets) {
                // 1. 各アセットアイテムの外側のコンテナ(div)を作る
                const itemDiv = document.createElement('div');
                itemDiv.className = 'asset-item';
                // HTMLのデータ属性として、アセットキーとパスを埋め込んでおく
                itemDiv.dataset.assetKey = asset.key;
                itemDiv.dataset.assetPath = asset.path;
                
                // 2. プレビュー画像(img)を作る
                const previewImg = document.createElement('img');
                previewImg.className = 'asset-preview';
                previewImg.src = asset.path; // 画像のパスをsrcに設定
                
                // 3. アセットキー(span)を作る
                const keySpan = document.createElement('span');
                keySpan.className = 'asset-key';
                keySpan.innerText = asset.key;
                
                // 4. コンテナに画像とキーを追加
                itemDiv.appendChild(previewImg);
                itemDiv.appendChild(keySpan);
                
                // 5. 最終的に、リスト全体にこのアイテムを追加
                this.assetListContainer.appendChild(itemDiv);
            }
            
            console.log(`[EditorPlugin] Asset Browser populated with ${imageAssets.length} image assets.`);
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
   // --- 区切り線 ---
        const separator = document.createElement('hr');
        separator.style.borderColor = '#555';
        this.editorPropsContainer.appendChild(separator);

        // --- エクスポートボタン ---
        const exportButton = document.createElement('button');
        exportButton.innerText = 'Export Layout (to Console)';
        exportButton.style.width = '100%';
        exportButton.style.padding = '8px';
        exportButton.style.backgroundColor = '#4a4';
        exportButton.style.color = 'white';
        exportButton.style.border = 'none';
        exportButton.style.borderRadius = '3px';
        exportButton.style.cursor = 'pointer';

        // ボタンがクリックされたら、exportLayoutToJsonメソッドを呼び出す
        exportButton.addEventListener('click', () => {
            this.exportLayoutToJson();
        });

        this.editorPropsContainer.appendChild(exportButton);
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
           if (this.editorPanel) {
            this.editorPanel.style.display = 'none';
        }
        super.destroy();
    }  }