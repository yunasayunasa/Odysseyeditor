// src/editor/EditorUI.js

export default class EditorUI {
    constructor(game, editorPlugin) {
        this.game = game;
        this.plugin = editorPlugin; // EditorPluginへの参照を保持

        // --- HTML要素の取得 ---
        this.editorPanel = document.getElementById('editor-panel');
        this.assetBrowserPanel = document.getElementById('asset-browser');
        this.assetBrowserToggleBtn = document.getElementById('toggle-asset-browser');
        this.assetListContainer = document.getElementById('asset-list');

        // --- 各機能の初期化 ---
        this.initPanelDrag(this.editorPanel, '#editor-title');
        this.initPanelDrag(this.assetBrowserPanel, '#asset-browser-title');
        this.initAssetBrowserToggle();
        this.populateAssetBrowser();
        this.initDragAndDrop();
    }
    
    /**
     * 指定されたHTMLパネルを、ヘッダー部分を掴んでドラッグ移動できるようにする
     * @param {HTMLElement} panel - 対象のパネル要素
     * @param {string} headerSelector - ドラッグハンドルとなるヘッダーのCSSセレクタ
     */
   initPanelDrag(panel, headerSelector) {
        if (!panel) return;
        const header = panel.querySelector(headerSelector);
        if (!header) return;

        let isDragging = false;
        let offsetX, offsetY;

        header.addEventListener('mousedown', (e) => {
            // ★★★★★★★★★★★★★★★★★★★★★★★★★★
            // ★★★ これが修正箇所です ★★★
            // ★★★ ヘッダー自身がクリックされた時だけイベントを止める ★★★
            // ★★★★★★★★★★★★★★★★★★★★★★★★★★
            if (e.target === header) {
                isDragging = true;
                offsetX = e.clientX - panel.offsetLeft;
                offsetY = e.clientY - panel.offsetTop;
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            }
        });

        const onMouseMove = (e) => {
            if (isDragging) {
                panel.style.left = `${e.clientX - offsetX}px`;
                panel.style.top = `${e.clientY - offsetY}px`;
                panel.style.right = 'auto';
            }
        };

        const onMouseUp = (e) => {
            isDragging = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }
    
    /**
     * アセット・ブラウザの表示/非表示を切り替えるトグルボタンを初期化する
     */
    initAssetBrowserToggle() {
        if (!this.assetBrowserPanel || !this.assetBrowserToggleBtn) return;

        this.assetBrowserPanel.style.display = 'none';
        this.assetBrowserToggleBtn.style.display = 'block';

        this.assetBrowserToggleBtn.addEventListener('click', () => {
            const isHidden = this.assetBrowserPanel.style.display === 'none';
            this.assetBrowserPanel.style.display = isHidden ? 'block' : 'none';
        });
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

        gameCanvas.addEventListener('drop', (event) => {
            event.preventDefault();
            const assetKey = event.dataTransfer.getData('text/plain');
            if (!assetKey) return;

            const pointer = this.game.input.activePointer;
            const scenes = this.game.scene.getScenes(true);
            let targetScene = null;

            for (let i = scenes.length - 1; i >= 0; i--) {
                const scene = scenes[i];
                if (scene.cameras.main.hitTest(pointer.x, pointer.y) && scene.scene.key !== 'UIScene') {
                    targetScene = scene;
                    break;
                }
            }

            if (targetScene) {
                const newImage = targetScene.add.image(pointer.worldX, pointer.worldY, assetKey);
                newImage.name = `${assetKey}_${Date.now()}`;
                this.plugin.makeEditable(newImage, targetScene);
                console.log(`[EditorUI] Dropped asset '${assetKey}' into scene '${targetScene.scene.key}'`);
            }
        });
    }
}