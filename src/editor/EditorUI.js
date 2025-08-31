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
        gameCanvas.addEventListener('drop', (event) => {
            event.preventDefault();

            const assetKey = event.dataTransfer.getData('text/plain');
            if (!assetKey) return;
            
            // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
            // ★★★ ここからが座標系を修正する核心部です ★★★
            // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

            // 1. ゲームキャンバスの、ブラウザ上での位置とサイズを取得
            const canvasBounds = gameCanvas.getBoundingClientRect();

            // 2. ブラウザのクリック座標から、キャンバスの相対座標を計算
            const localX = event.clientX - canvasBounds.left;
            const localY = event.clientY - canvasBounds.top;
            
            // 3. Phaserのポインターの座標を、計算したローカル座標で上書き
            //    これにより、以降の処理はすべて正しいPhaser座標系で行われる
            const pointer = this.game.input.activePointer;
            pointer.x = localX;
            pointer.y = localY;
            
            // ★★★ これで座標系のズレが完全に修正されました ★★★


            const scenes = this.game.scene.getScenes(true);
            let targetScene = null;
            
            for (let i = scenes.length - 1; i >= 0; i--) {
                const scene = scenes[i];
                // 正しい座標で判定するので、今度は成功するはず
                if (scene.cameras.main.worldView.contains(pointer.x, pointer.y) && scene.scene.key !== 'UIScene') {
                    targetScene = scene;
                    break;
                }
            }

            if (targetScene) {
                // ... (オブジェクト生成のロジックは、以前のもので完璧です)
                const newImage = targetScene.add.image(pointer.worldX, pointer.worldY, assetKey);
                
                if (targetScene.scene.key === 'GameScene' && targetScene.layer && targetScene.layer.character) {
                    targetScene.layer.character.add(newImage);
                } else {
                    targetScene.add.existing(newImage);
                }
                
                newImage.name = `${assetKey}_${Date.now()}`;
                this.plugin.makeEditable(newImage, targetScene);
            } else {
                // (デバッグ用) ターゲットシーンが見つからなかった場合のログ
                console.warn("[EditorUI] Drop successful, but no target scene found at calculated coordinates:", { x: localX, y: localY });
            }
        });
    }
}