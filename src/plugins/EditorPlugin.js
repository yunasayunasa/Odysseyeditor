
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
         this.assetBrowserToggleBtn = document.getElementById('toggle-asset-browser');
    }

init() {
        console.log('[EditorPlugin] Initialized.');

        // ★★★ 変更点1: パネルの初期化処理をヘルパーメソッドに分離 ★★★
        this.initPanel(this.editorPanel, '#editor-title');
        this.initPanel(this.assetBrowserPanel, '#asset-browser-title');

        // ★★★ 変更点2: アセット・ブラウザの表示処理を修正 ★★★
        if (this.assetBrowserPanel) {
            this.assetBrowserPanel.style.display = 'none'; // 初期状態は非表示
            this.assetBrowserToggleBtn.style.display = 'block'; // トグルボタンを表示

            this.assetBrowserToggleBtn.addEventListener('click', () => {
                const isHidden = this.assetBrowserPanel.style.display === 'none';
                this.assetBrowserPanel.style.display = isHidden ? 'block' : 'none';
            });
            
            this.populateAssetBrowser(); // アセット一覧の生成
        }
    }
 /**
     * パネルをドラッグ移動可能にし、入力の貫通を防ぐ
     * @param {HTMLElement} panel - 対象のパネル要素
     * @param {string} headerSelector - ドラッグハンドルとなるヘッダーのCSSセレクタ
     */
    initPanel(panel, headerSelector) {
        if (!panel) return;
        panel.style.display = 'block';

        const header = panel.querySelector(headerSelector);
        if (!header) return;

        // ★★★ 変更点1: パネル全体にmousedownイベントを追加 ★★★
        // パネルのどの部分（ヘッダー、コンテンツ、ボタン）がクリックされても、
        // Phaser側の入力はいったん無効にする
        panel.addEventListener('mousedown', (e) => {
            // ★★★ これが核心部です ★★★
            // Phaserのゲーム全体の入力を無効化する
            this.pluginManager.game.input.enabled = false;
        });

        // ★★★ 変更点2: マウスボタンが「どこで」離されたかを検知するため、windowに追加 ★★★
        // パネルの外でマウスアップしても、入力を復帰させる必要がある
        window.addEventListener('mouseup', () => {
            // ★★★ これが核心部です ★★★
            // 一定時間後にPhaserの入力を有効に戻す
            // setTimeoutを使うのは、クリックイベントの処理が完全に終わってから
            // 入力を復帰させるための、安全策です。
            setTimeout(() => {
                if (this.pluginManager.game) { // ゲームがまだ存在するか確認
                    this.pluginManager.game.input.enabled = true;
                }
            }, 100);
        });

        
        // --- 以下、ドラッグ移動のロジック (少し修正) ---
        let isDragging = false;
        let offsetX, offsetY;

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            window.addEventListener('mousemove', onMouseMove);
            // mouseupリスナーは、上記のwindow.addEventListenerで既に設定済み
        });

        const onMouseMove = (e) => {
            if (isDragging) {
                panel.style.left = `${e.clientX - offsetX}px`;
                panel.style.top = `${e.clientY - offsetY}px`;
                panel.style.right = 'auto';
            }
        };
        
        // ドラッグ終了時にisDraggingフラグだけをリセットする専用のリスナー
        header.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

        /**
     * アセット・ブラウザの中身（アセットリスト）を動的に生成する
     */
    populateAssetBrowser() {
        // アセットリストを表示するコンテナ要素がなければ、処理を中断
        if (!this.assetListContainer) {
            console.error('[EditorPlugin] Asset list container element not found.');
            return;
        }
        
        // Phaserのレジストリから、PreloadSceneで登録したアセットリストを取得
        const assetList = this.pluginManager.game.registry.get('asset_list');
        if (!assetList) {
            console.warn('[EditorPlugin] Asset list not found in registry.');
            return;
        }
        
        // 新しくリストを生成する前に、古い内容を一度すべてクリアする
        this.assetListContainer.innerHTML = '';
        
        // アセットリストの中から、'image'タイプのものだけをフィルタリングして取り出す
        const imageAssets = assetList.filter(asset => asset.type === 'image');

        // 取り出した画像アセットの情報を元に、ループでHTML要素を生成していく
        for (const asset of imageAssets) {
            // 1. 各アセットアイテムを包む外側の <div> を作る
            const itemDiv = document.createElement('div');
            itemDiv.className = 'asset-item';
            
            // ★重要★ 次のステップ（ドラッグ＆ドロップ）で使うための情報を、
            // HTMLのデータ属性として埋め込んでおく
            itemDiv.dataset.assetKey = asset.key;
            itemDiv.dataset.assetPath = asset.path;
            
            // 2. プレビュー画像を表示するための <img> タグを作る
            const previewImg = document.createElement('img');
            previewImg.className = 'asset-preview';
            previewImg.src = asset.path; // 画像ファイルのパスをsrc属性に設定
            previewImg.alt = asset.key;  // 画像が表示されなかった時用の代替テキスト
            
            // 3. アセットキー（ファイル名）を表示するための <span> タグを作る
            const keySpan = document.createElement('span');
            keySpan.className = 'asset-key';
            keySpan.innerText = asset.key;
            
            // 4. 組み立て：外側の<div>に、<img>と<span>を追加する
            itemDiv.appendChild(previewImg);
            itemDiv.appendChild(keySpan);
            
            // 5. 完成したアセットアイテムのHTML要素を、リスト全体に追加する
            this.assetListContainer.appendChild(itemDiv);
        }
        
        console.log(`[EditorPlugin] Asset Browser populated with ${imageAssets.length} image assets.`);
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