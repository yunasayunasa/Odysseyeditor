// src/plugins/EditorPlugin.js (真のスリム化・完成版)

export default class EditorPlugin extends Phaser.Plugins.BasePlugin {
    constructor(pluginManager) {
        super(pluginManager);
        this.selectedObject = null;
        this.editableObjects = new Map();

        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ これがエラーの原因でした。以下の3行を復活させます。 ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        this.editorPanel = document.getElementById('editor-panel');
        this.editorTitle = document.getElementById('editor-title');
        this.editorPropsContainer = document.getElementById('editor-props');
         // ★★★ 変更点1: 新しいHTML要素への参照を追加 ★★★
        this.transformTab = document.getElementById('transform-tab');
        this.physicsTab = document.getElementById('physics-tab');
        this.physicsPropsContainer = document.getElementById('physics-props');
        this.tabButtons = document.querySelectorAll('.tab-button');
    }
    

    init() {
        console.log('[EditorPlugin] Initialized.');
           // ★★★ 変更点2: タブ切り替えのイベントリスナーを設定 ★★★
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // すべてのタブボタンとコンテンツから 'active' クラスを削除
                this.tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                // クリックされたボタンと、対応するコンテンツに 'active' クラスを追加
                const tabId = button.dataset.tab;
                button.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    }
    

    /**
     * @param {Phaser.GameObjects.GameObject} gameObject
     * @param {Phaser.Scene} scene
     */
    makeEditable(gameObject, scene) {
        if (!gameObject || !scene || gameObject.getData('isEditable')) return;
        
        gameObject.setInteractive();
        scene.input.setDraggable(gameObject);

        const sceneKey = scene.scene.key;
        if (!this.editableObjects.has(sceneKey)) {
            this.editableObjects.set(sceneKey, new Set());
        }
        this.editableObjects.get(sceneKey).add(gameObject);

        gameObject.on('pointerdown', () => {
            this.selectedObject = gameObject;
            this.updatePropertyPanel();
        });

        gameObject.on('dragstart', () => {
            // 必要に応じてドラッグ開始時の処理を追加
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
     * プロパティ編集パネルの表示を更新する
     */
   /**
     * ★★★ 変更点3: updatePropertyPanelをタブ対応版に完全に置き換える ★★★
     */
    updatePropertyPanel() {
        if (!this.editorPanel) return;

        // まず、両方のタブの中身を空にする
        this.editorPropsContainer.innerHTML = '';
        this.physicsPropsContainer.innerHTML = '';

        if (!this.selectedObject) {
            this.editorPanel.style.visibility = 'hidden';
            return;
        }

        this.editorPanel.style.visibility = 'visible';
        this.editorTitle.innerText = `Editing: ${this.selectedObject.name || '(no name)'}`;

        // --- Transformタブの中身を生成 ---
        this.populateTransformTab();

        // --- Physicsタブの中身を生成 ---
        this.populatePhysicsTab();
    }
    
    /**
     * ★★★ 新規メソッド: Transformタブの中身を生成する ★★★
     */
    
        populateTransformTab() {
        // ★★★ 変更点1: プロパティパネルの中身を一度クリア ★★★
        this.editorPropsContainer.innerHTML = '';
        if (!this.selectedObject) return;

        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ ここからが、リネーム機能の追加部分です ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

        // --- Nameプロパティの編集UI ---
        const nameRow = document.createElement('div');
        const nameLabel = document.createElement('label');
        nameLabel.innerText = 'Name:';
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = this.selectedObject.name || ''; // 現在の名前を表示
        
        // 入力が変更されたら、オブジェクトのnameプロパティをリアルタイムに更新
        nameInput.addEventListener('input', (e) => {
            const newName = e.target.value;
            if (this.selectedObject) {
                this.selectedObject.name = newName;
                // ★重要★ パネルのタイトルもリアルタイムで更新
                this.editorTitle.innerText = `Editing: ${newName}`;
            }
        });
        
        nameRow.appendChild(nameLabel);
        nameRow.appendChild(nameInput);
        this.editorPropsContainer.appendChild(nameRow);

        // --- 区切り線 ---
        const separator = document.createElement('hr');
        this.editorPropsContainer.appendChild(separator);


        // --- 既存のTransformプロパティ (x, y, scaleなど) の生成 ---
        const properties = {
            x: { type: 'number', step: 1 },
            y: { type: 'number', step: 1 },
            scaleX: { type: 'range', min: 0.1, max: 5, step: 0.01 },
            scaleY: { type: 'range', min: 0.1, max: 5, step: 0.01 },
            angle: { type: 'range', min: -180, max: 180, step: 1 },
            alpha: { type: 'range', min: 0, max: 1, step: 0.01 }
        };
           for (const key in properties) {
            // ... (これまでのプロパティHTML要素の生成ロジックは変更なし)
        }

        // --- エクスポートボタン (変更なし) ---
        // ...
    
    }


    /**
     * ★★★ 新規メソッド: Physicsタブの中身を生成する ★★★
     */
    populatePhysicsTab() {
        const gameObject = this.selectedObject;
        
        // オブジェクトが物理ボディを持っているかチェック
        if (gameObject && gameObject.body) {
            // ボディを持っている場合:
            // パラメータ編集用のUIをここに生成していく（次のステップで実装）
            this.physicsPropsContainer.innerHTML = `<p>Physics properties for ${gameObject.name}.</p>`;
        } else {
            // ボディを持っていない場合:
            // 物理ボディを追加するためのボタンを表示する（これも次のステップで）
            this.physicsPropsContainer.innerHTML = `<p>This object has no physics body.</p>`;
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
        // ★★★ 変更点: HTMLパネルの非表示はEditorUIの責任なので、ここからは削除 ★★★
        super.destroy();
    }
}