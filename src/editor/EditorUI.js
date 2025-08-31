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

      // --- 1. dragenter: ドラッグ要素がキャンバス領域に「入った」瞬間のイベント ---
        // ここで preventDefault を呼ぶのが最も確実
        gameCanvas.addEventListener('dragenter', (event) => {
            event.preventDefault();
        });

        // --- 2. dragover: ドラッグ要素がキャンバス領域の上を「移動中」のイベント ---
        // こちらでも preventDefault を呼んでおくことで、より確実になる
        gameCanvas.addEventListener('dragover', (event) => {
            event.preventDefault();
        });
        
        // --- 3. drop: ドラッグ要素がキャンバス上で「離された」瞬間のイベント ---
        gameCanvas.addEventListener('drop', (event) => {
            event.preventDefault(); // 念のためここでも呼ぶ

            const assetKey = event.dataTransfer.getData('text/plain');
            if (!assetKey) return;

            const pointer = this.game.input.activePointer;
            const scenes = this.game.scene.getScenes(true);
            let targetScene = null;

            for (let i = scenes.length - 1; i >= 0; i--) {
                const scene = scenes[i];
                // マウスカーソルがカメラの表示領域内にあるか、より単純な方法でチェック
                if (scene.cameras.main.worldView.contains(pointer.x, pointer.y) && scene.scene.key !== 'UIScene') {
                    targetScene = scene;
                    break;
                }
            }

            if (targetScene) {
                const newImage = new Phaser.GameObjects.Image(targetScene, pointer.worldX, pointer.worldY, assetKey);
                
                if (targetScene.scene.key === 'GameScene' && targetScene.layer && targetScene.layer.character) {
                    targetScene.layer.character.add(newImage);
                } else {
                    targetScene.add.existing(newImage);
                }
                
                newImage.name = `${assetKey}_${Date.now()}`;
                this.plugin.makeEditable(newImage, targetScene);
            }
        });
    }
    // ★★★ 変更点2: 不要になった initPanelDrag と initAssetBrowserToggle メソッドを完全に削除 ★★★
}