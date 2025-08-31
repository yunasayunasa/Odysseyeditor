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

        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ この2つのリスナーが最も重要です ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // --- dragenter: ドラッグ要素がキャンバス領域に「入った」瞬間のイベント ---
        gameCanvas.addEventListener('dragenter', (event) => {
            event.preventDefault();
        });

        // --- dragover: ドラッグ要素がキャンバス領域の上を「移動中」のイベント ---
        gameCanvas.addEventListener('dragover', (event) => {
            event.preventDefault();
        });
        

        // --- drop イベントリスナーをデバッグモードに ---
        gameCanvas.addEventListener('drop', (event) => {
            event.preventDefault();

            // --- ログ爆弾フェーズ1: イベント発生の確認 ---
            console.log("💣💥 LOG BOMB V2.1 - PHASE 1: Drop event fired!");
            const assetKey = event.dataTransfer.getData('text/plain');
            if (!assetKey) {
                console.error("💣💥 BOMB DEFUSED: No assetKey found in dataTransfer.");
                return;
            }
            console.log(`💣 Asset Key: ${assetKey}`);
            const pointer = this.game.input.activePointer;
            console.log(`💣 Pointer Screen Coords: x=${pointer.x}, y=${pointer.y}`);

            // --- ログ爆弾フェーズ2: ターゲットシーンの特定 ---
            console.log("💣💥 LOG BOMB V2.1 - PHASE 2: Searching for target scene...");
            const scenes = this.game.scene.getScenes(true);
            let targetScene = null;
            console.log(`💣 Active scenes found: ${scenes.map(s => s.scene.key).join(', ')}`);
            for (let i = scenes.length - 1; i >= 0; i--) {
                const scene = scenes[i];
                const contains = scene.cameras.main.worldView.contains(pointer.x, pointer.y);
                console.log(`💣 Checking scene '${scene.scene.key}'... Pointer inside camera view: ${contains}`);
                if (contains && scene.scene.key !== 'UIScene') {
                    targetScene = scene;
                    console.log(`💣💥 Target Scene Found: '${targetScene.scene.key}'`);
                    break;
                }
            }
            if (!targetScene) {
                console.error("💣💥 BOMB DEFUSED: No suitable target scene found at drop location.");
                return;
            }

            // --- ログ爆弾フェーズ3: オブジェクトの生成とプロパティの徹底調査 ---
            console.log("💣💥 LOG BOMB V2.1 - PHASE 3: Creating GameObject...");
            const newImage = targetScene.add.image(pointer.worldX, pointer.worldY, assetKey);
            console.log("--- 💣 OBJECT PROPERTY INSPECTION 💣 ---");
            console.log(`  - Is object created?`, !!newImage);
            console.log(`  - Name (before set):`, newImage.name);
            console.log(`  - Texture Key:`, newImage.texture.key);
            console.log(`  - Position (world): x=${newImage.x}, y=${newImage.y}`);
            console.log(`  - Scale: x=${newImage.scaleX}, y=${newImage.scaleY}`);
            console.log(`  - Alpha:`, newImage.alpha);
            console.log(`  - Visible:`, newImage.visible);
            console.log(`  - Depth:`, newImage.depth);
            console.log(`  - Parent Container (before move):`, newImage.parentContainer || 'None (Scene Root)');
            console.log("-----------------------------------------");
            
            newImage.name = `${assetKey}_${Date.now()}`;

            // --- ログ爆弾フェーズ4: レイヤーへの追加と状態変化の追跡 ---
            console.log("💣💥 LOG BOMB V2.1 - PHASE 4: Adding to layer...");
            if (targetScene.scene.key === 'GameScene' && targetScene.layer && targetScene.layer.character) {
                targetScene.layer.character.add(newImage);
                console.log(`💣 Object moved to 'character' layer.`);
                console.log("--- 💣 OBJECT PROPERTY INSPECTION (AFTER MOVE) 💣 ---");
                console.log(`  - Parent Container (after move):`, newImage.parentContainer ? newImage.parentContainer.name || 'Unnamed Container' : 'None');
                console.log(`  - Final Depth:`, newImage.depth);
                console.log(`  - Character layer's total objects:`, targetScene.layer.character.list.length);
                console.log("-----------------------------------------");
            }
            
            // --- ログ爆弾フェーズ5: エディタ登録 ---
            console.log("💣💥 LOG BOMB V2.1 - PHASE 5: Making editable...");
            this.plugin.makeEditable(newImage, targetScene);

            console.log("💣💥 BOMB SEQUENCE COMPLETE. If you see this, the code ran without errors.");
        });
    }
}