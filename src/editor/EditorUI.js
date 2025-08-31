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

        gameCanvas.addEventListener('dragover', (event) => {
            event.preventDefault();
        });

     // --- drop イベントリスナーをデバッグモードに ---
        gameCanvas.addEventListener('drop', (event) => {
            event.preventDefault();

            // --- ログ爆弾フェーズ1: イベント発生の確認 ---
            console.log("💣💥 LOG BOMB PHASE 1: Drop event fired!");

            const assetKey = event.dataTransfer.getData('text/plain');
            if (!assetKey) {
                console.error("💣💥 BOMB DEFUSED: No assetKey found in dataTransfer.");
                return;
            }
            console.log(`💣 Asset Key: ${assetKey}`);

            const pointer = this.game.input.activePointer;
            console.log(`💣 Pointer Coordinates: x=${pointer.x}, y=${pointer.y}`);

            // --- ログ爆弾フェーズ2: ターゲットシーンの特定 ---
            console.log("💣💥 LOG BOMB PHASE 2: Searching for target scene...");
            const scenes = this.game.scene.getScenes(true);
            let targetScene = null;
            
            console.log(`💣 Active scenes found: ${scenes.map(s => s.scene.key).join(', ')}`);

            for (let i = scenes.length - 1; i >= 0; i--) {
                const scene = scenes[i];
                const hit = scene.cameras.main.hitTest(pointer.x, pointer.y);
                console.log(`💣 Checking scene '${scene.scene.key}'... Hit test result: ${hit}`);

                if (hit && scene.scene.key !== 'UIScene') {
                    targetScene = scene;
                    console.log(`💣💥 Target Scene Found: '${targetScene.scene.key}'`);
                    break;
                }
            }

            if (!targetScene) {
                console.error("💣💥 BOMB DEFUSED: No suitable target scene found at drop location.");
                return;
            }

            // --- ログ爆弾フェーズ3: オブジェクトの生成と追加 ---
            console.log("💣💥 LOG BOMB PHASE 3: Creating and adding GameObject...");
            const newImage = targetScene.add.image(pointer.worldX, pointer.worldY, assetKey);
            
            if (!newImage) {
                 console.error("💣💥 BOMB DEFUSED: targetScene.add.image() failed to return a new object.");
                 return;
            }
            console.log(`💣 New image object created. Texture key: '${newImage.texture.key}'`);
            console.log(`💣 Initial position: x=${newImage.x}, y=${newImage.y}`);
            
            newImage.name = `${assetKey}_${Date.now()}`;

            if (targetScene.scene.key === 'GameScene' && targetScene.layer && targetScene.layer.character) {
                targetScene.layer.character.add(newImage);
                console.log(`💣 Object added to GameScene's character layer.`);
                console.log(`💣 Character layer size: ${targetScene.layer.character.list.length}`);
            } else {
                // GameScene以外、あるいはレイヤーがない場合は、add.existingでシーン直下に追加
                // targetScene.add.existing(newImage); // add.imageが既に追加しているので不要
                console.log(`💣 Object added directly to scene '${targetScene.scene.key}'.`);
            }
            
            // --- ログ爆弾フェーズ4: 可視性と深度のチェック ---
            console.log("💣💥 LOG BOMB PHASE 4: Checking visibility and depth...");
            newImage.setVisible(true); // 念のため、強制的に表示状態にする
            console.log(`💣 Object visible: ${newImage.visible}`);
            console.log(`💣 Object alpha: ${newImage.alpha}`);
            console.log(`💣 Object depth: ${newImage.depth}`);
            
            if(targetScene.layer && targetScene.layer.character){
                 console.log(`💣 Parent container (layer) depth: ${targetScene.layer.character.depth}`);
            }

            // --- ログ爆弾フェーズ5: エディタ登録 ---
            console.log("💣💥 LOG BOMB PHASE 5: Making object editable...");
            this.plugin.makeEditable(newImage, targetScene);

            console.log("💣💥 BOMB SEQUENCE COMPLETE. Check the scene display.");
        });
    }}