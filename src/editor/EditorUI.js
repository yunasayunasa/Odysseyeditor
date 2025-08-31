// src/editor/EditorUI.js

export default class EditorUI {
    constructor(game, editorPlugin) {
        this.game = game;
        this.plugin = editorPlugin;

        // --- HTML要素の取得 ---
        this.assetListContainer = document.getElementById('asset-list');

        // ★★★ 変更点1: 不要になった機能の初期化を削除 ★★★
        // this.initPanelDrag(...) は呼び出さない
        // this.initAssetBrowserToggle() は呼び出さない

        // --- 必要な機能だけを初期化 ---
        this.populateAssetBrowser();
        this.initDragAndDrop();
        this.objectCounters = {};
    }
    
    /**
     * アセット・ブラウザの中身（アセットリスト）を動的に生成する
     */
    populateAssetBrowser() {
        if (!this.assetListContainer) return;
        
        const assetList = this.game.registry.get('asset_list');
        if (!assetList) return;
        
        this.assetListContainer.innerHTML = '';
        
        const imageAssets = assetList.filter(asset => asset.type === 'image');

        for (const asset of imageAssets) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'asset-item';
            itemDiv.dataset.assetKey = asset.key;
            itemDiv.dataset.assetPath = asset.path;
            itemDiv.draggable = true;
            
            const previewImg = document.createElement('img');
            previewImg.className = 'asset-preview';
            previewImg.src = asset.path;
            previewImg.alt = asset.key;
            
            const keySpan = document.createElement('span');
            keySpan.className = 'asset-key';
            keySpan.innerText = asset.key;
            
            itemDiv.appendChild(previewImg);
            itemDiv.appendChild(keySpan);
            
            this.assetListContainer.appendChild(itemDiv);
        }
    }

    /**
     * アセット・ブラウザからゲームキャンバスへのドラッグ＆ドロップ機能を初期化する
     */
    initDragAndDrop() {
        document.addEventListener('dragstart', (event) => {
            const assetItem = event.target.closest('.asset-item');
            if (assetItem) {
                event.dataTransfer.setData('text/plain', assetItem.dataset.assetKey);
                event.dataTransfer.effectAllowed = 'copy';
            }
        });

           const gameCanvas = this.game.canvas;

        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ 「アセットが戻る」問題を解決するリスナーを復活させます ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        gameCanvas.addEventListener('dragenter', (event) => {
            event.preventDefault();
        });
        gameCanvas.addEventListener('dragover', (event) => {
            event.preventDefault();
        });
        
        // --- drop イベントリスナーに、ログ爆弾と座標系修正を組み込む ---
        gameCanvas.addEventListener('drop', (event) => {
            event.preventDefault();

            // --- ログ爆弾フェーズ1: イベントと座標系の確認 ---
            console.log("💣💥 LOG BOMB FINAL - PHASE 1: Drop event fired!");
            const assetKey = event.dataTransfer.getData('text/plain');
            if (!assetKey) {
                console.error("💣💥 BOMB DEFUSED: No assetKey found.");
                return;
            }
            console.log(`💣 Asset Key: '${assetKey}'`);

            const canvasBounds = gameCanvas.getBoundingClientRect();
            const localX = event.clientX - canvasBounds.left;
            const localY = event.clientY - canvasBounds.top;
            
            console.log(`💣 Browser Click Coords: clientX=${event.clientX}, clientY=${event.clientY}`);
            console.log(`💣 Canvas Bounding Rect: left=${canvasBounds.left}, top=${canvasBounds.top}`);
            console.log(`💣 Calculated Local Coords: localX=${localX}, localY=${localY}`);

            const pointer = this.game.input.activePointer;
            pointer.x = localX;
            pointer.y = localY;
            
            // --- ログ爆弾フェーズ2: ターゲットシーンの特定 ---
            console.log("💣💥 LOG BOMB FINAL - PHASE 2: Searching for target scene...");
            const scenes = this.game.scene.getScenes(true);
            let targetScene = null;
            for (let i = scenes.length - 1; i >= 0; i--) {
                const scene = scenes[i];
                const contains = scene.cameras.main.worldView.contains(pointer.x, pointer.y);
                console.log(`💣 Checking scene '${scene.scene.key}' with coords (x=${pointer.x}, y=${pointer.y})... Inside camera view: ${contains}`);
                if (contains && scene.scene.key !== 'UIScene') {
                    targetScene = scene;
                    console.log(`💣💥 Target Scene Found: '${targetScene.scene.key}'`);
                    break;
                }
            }
               if (targetScene) {
                const newImage = targetScene.add.image(pointer.worldX, pointer.worldY, assetKey);

                // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
                // ★★★ ここが、連番命名ロジックです ★★★
                // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
                
                // このアセットキーのカウンターを初期化またはインクリメント
                if (!this.objectCounters[assetKey]) {
                    this.objectCounters[assetKey] = 1;
                } else {
                    this.objectCounters[assetKey]++;
                }
                
                // 新しい名前を生成 (例: yuko_smile_1, yuko_smile_2)
                newImage.name = `${assetKey}_${this.objectCounters[assetKey]}`;

                this.plugin.makeEditable(newImage, targetScene);

                // ★★★ ドロップ直後に、そのオブジェクトを選択状態にする ★★★
                this.plugin.selectedObject = newImage;
                this.plugin.updatePropertyPanel();
            }
        });
    }
}
