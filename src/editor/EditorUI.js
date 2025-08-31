// src/editor/EditorUI.js (新規作成)

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

        
    
    // アセットブラウザの表示/非表示機能
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
               itemDiv.draggable = true;
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


    // ★★★ ここが新しい核心部 ★★★
    // ドラッグ＆ドロップのイベントリスナー
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
                this.plugin.makeEditable(newImage, targetScene); // EditorPluginのメソッドを呼び出す
                console.log(`[EditorUI] Dropped asset '${assetKey}' into scene '${targetScene.scene.key}'`);
            }
        });
    }
}