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
    // src/plugins/EditorPlugin.js

    // ... (他のメソッドは変更なし)

    /**
     * Transformタブの中身を生成する（完全版）
     */
    populateTransformTab() {
        // プロパティパネルの中身を一度クリア
        this.editorPropsContainer.innerHTML = '';
        if (!this.selectedObject) return;

        // --- Nameプロパティの編集UI (これは既に実装済みですね) ---
        const nameRow = document.createElement('div');
        const nameLabel = document.createElement('label');
        nameLabel.innerText = 'Name:';
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = this.selectedObject.name || '';
        
        nameInput.addEventListener('input', (e) => {
            const newName = e.target.value;
            if (this.selectedObject) {
                this.selectedObject.name = newName;
                this.editorTitle.innerText = `Editing: ${newName}`;
            }
        });
        
        nameRow.appendChild(nameLabel);
        nameRow.appendChild(nameInput);
        this.editorPropsContainer.appendChild(nameRow);

        const separator = document.createElement('hr');
        this.editorPropsContainer.appendChild(separator);


        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ ここからが、復活させる「見た目のプロパ-ティ」の生成ループです ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

        const properties = {
            x: { type: 'number', step: 1 },
            y: { type: 'number', step: 1 },
            scaleX: { type: 'range', min: 0.1, max: 5, step: 0.01 },
            scaleY: { type: 'range', min: 0.1, max: 5, step: 0.01 },
            angle: { type: 'range', min: -180, max: 180, step: 1 },
            alpha: { type: 'range', min: 0, max: 1, step: 0.01 }
        };

        for (const key in properties) {
            // 選択中のオブジェクトがそのプロパティを持っているか確認
            if (this.selectedObject[key] === undefined) continue;

            const prop = properties[key];
            const value = this.selectedObject[key];
            
            const row = document.createElement('div');
            const label = document.createElement('label');
            label.innerText = `${key}:`;

            const input = document.createElement('input');
            input.type = prop.type;
            if (prop.min !== undefined) input.min = prop.min;
            if (prop.max !== undefined) input.max = prop.max;
            if (prop.step !== undefined) input.step = prop.step;
            input.value = value;

            // 入力が変更されたら、オブジェクトのプロパティをリアルタイムに更新
            input.addEventListener('input', (e) => {
                const newValue = parseFloat(e.target.value);
                if (!isNaN(newValue) && this.selectedObject) {
                    // scaleXとscaleYを連動させるための特別な処理
                    if (key === 'scaleX' && e.shiftKey) { // Shiftキーを押しながら操作
                        this.selectedObject.setScale(newValue, newValue);
                        // Yのスライダー表示も更新
                        const scaleYInput = this.editorPropsContainer.querySelector('input[data-key="scaleY"]');
                        if (scaleYInput) scaleYInput.value = newValue;
                    } else if (key === 'scaleY' && e.shiftKey) {
                         this.selectedObject.setScale(newValue, newValue);
                         const scaleXInput = this.editorPropsContainer.querySelector('input[data-key="scaleX"]');
                         if (scaleXInput) scaleXInput.value = newValue;
                    } else {
                        this.selectedObject[key] = newValue;
                    }
                }
            });
            // 後から参照できるようにキーをデータ属性として設定
            input.dataset.key = key;

            row.appendChild(label);
            row.appendChild(input);
            this.editorPropsContainer.appendChild(row);
        }

        // --- エクスポートボタン (変更なし) ---
        const exportSeparator = document.createElement('hr');
        this.editorPropsContainer.appendChild(exportSeparator);
        
        const exportButton = document.createElement('button');
        exportButton.innerText = 'Export Layout (to Console)';
        exportButton.addEventListener('click', () => {
            this.exportLayoutToJson();
        });
        this.editorPropsContainer.appendChild(exportButton);
    }


   // src/plugins/EditorPlugin.js

// ... (constructor, init, populateTransformTab などは変更なし)

     /**
    /**
     * Physicsタブの中身を生成する（最終確定版）
     */
    populatePhysicsTab() {
        this.physicsPropsContainer.innerHTML = '';
        const gameObject = this.selectedObject;
        if (!gameObject) return;

        if (gameObject.body) {
            // 物理ボディを持っている場合: プロパティ編集UIと「Disable」ボタンを表示
            this.createPhysicsPropertiesUI(gameObject);

            const removeButton = document.createElement('button');
            removeButton.innerText = 'Disable Physics';
            removeButton.style.backgroundColor = '#c44';
            removeButton.style.marginTop = '10px';
            removeButton.onclick = () => {
                if (this.selectedObject && this.selectedObject.body) {
                    this.selectedObject.body.destroy();
                    // オブジェクトからbodyプロパティを確実に削除する
                    this.selectedObject.body = null; 
                    this.updatePropertyPanel();
                }
            };
            this.physicsPropsContainer.appendChild(removeButton);

        } else {
            // 物理ボディを持っていない場合: 「Enable」ボタンを表示
            const addButton = document.createElement('button');
            addButton.innerText = 'Enable Arcade Physics';
            addButton.onclick = () => {
                if (this.selectedObject) {
                    // どのシーンにいるか動的に取得
                    const targetScene = this.selectedObject.scene;
                    targetScene.physics.add.existing(this.selectedObject, false); // 動的ボディとして生成
                    if (this.selectedObject.body) {
                        this.selectedObject.body.allowGravity = false;
                        this.selectedObject.body.collideWorldBounds = true;
                    }
                    this.updatePropertyPanel();
                }
            };
            this.physicsPropsContainer.appendChild(addButton);
        }
    }

    /**
     * 「Enable Physics」ボタンを生成する
     */
    /**
     * 「Enable Physics」ボタンを生成する（UX改善版）
     */
    createEnablePhysicsButton(gameObject) {
        const button = document.createElement('button');
        button.innerText = 'Enable Arcade Physics';
        button.onclick = () => {
            if (this.selectedObject) {
                // 動的(Dynamic)ボディとして生成
                this.pluginManager.game.scene.getScene('GameScene').physics.add.existing(this.selectedObject, false);
                
                // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
                // ★★★ ここがあなたの要望を叶えるコードです ★★★
                // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
                if (this.selectedObject.body) {
                    // 1. デフォルトでは重力をOFFにする
                    this.selectedObject.body.allowGravity = false;
                    
                    // 2. デフォルトでワールド境界との衝突をONにする
                    this.selectedObject.body.collideWorldBounds = true;
                }
                
                // 表示を即座に更新する
                this.updatePropertyPanel();
            }
        };
        this.physicsPropsContainer.appendChild(button);
    }


    /**
     * 物理パラメータを編集するためのUIを生成する（最終確定版）
     */
    createPhysicsPropertiesUI(gameObject) {
        const body = gameObject.body;
        
        // --- ボディタイプ (Static / Dynamic) の切り替え ---
        const isStatic = body.isStatic;
        // createCheckboxヘルパーを使う
        this.createCheckbox(this.physicsPropsContainer, 'Is Static Body', isStatic, (isChecked) => {
            if (this.selectedObject) {
                const targetScene = this.selectedObject.scene;
                // isStaticの状態をトグル（反転）させる
                const newStaticState = !this.selectedObject.body.isStatic;
                targetScene.physics.world.remove(this.selectedObject.body);
                targetScene.physics.add.existing(this.selectedObject, newStaticState);
                if (this.selectedObject.body) {
                    this.selectedObject.body.collideWorldBounds = true;
                }
                this.updatePropertyPanel();
            }
        });

        // --- 動的ボディの場合のみ、他のプロパティを表示 ---
        if (!isStatic) {
            this.createVector2Input(this.physicsPropsContainer, 'Size', body.setSize.bind(body), { x: body.width, y: body.height });
            this.createVector2Input(this.physicsPropsContainer, 'Offset', body.setOffset.bind(body), { x: body.offset.x, y: body.offset.y });
            this.createCheckbox(this.physicsPropsContainer, 'Allow Gravity', body.allowGravity, (value) => { if(body) body.allowGravity = value; });
            this.createRangeInput(this.physicsPropsContainer, 'Bounce X', body.bounce.x, 0, 1, 0.01, (value) => { if(body) body.bounce.x = value; });
            this.createRangeInput(this.physicsPropsContainer, 'Bounce Y', body.bounce.y, 0, 1, 0.01, (value) => { if(body) body.bounce.y = value; });
        }
        
        // --- 共通プロパティ ---
        this.createCheckbox(this.physicsPropsContainer, 'Collide World Bounds', body.collideWorldBounds, (value) => { if(body) body.collideWorldBounds = value; });
    }

    /**
     * XとYの2つの数値入力を持つUIパーツを生成する
     * @param {HTMLElement} container - 追加先のHTML要素
     * @param {string} label - 表示ラベル
     * @param {function} callback - 値が変更された時に呼び出される関数 (x, y を引数に取る)
     * @param {{x: number, y: number}} initialValue - 初期値
     */
    createVector2Input(container, label, callback, initialValue) {
        const row = document.createElement('div');
        const labelEl = document.createElement('label');
        labelEl.innerText = `${label}:`;
        labelEl.style.width = '100px';

        const inputX = document.createElement('input');
        inputX.type = 'number';
        inputX.value = initialValue.x.toFixed(2);
        inputX.style.width = '60px';
        inputX.addEventListener('input', () => callback(parseFloat(inputX.value), parseFloat(inputY.value)));

        const inputY = document.createElement('input');
        inputY.type = 'number';
        inputY.value = initialValue.y.toFixed(2);
        inputY.style.width = '60px';
        inputY.addEventListener('input', () => callback(parseFloat(inputX.value), parseFloat(inputY.value)));

        row.appendChild(labelEl);
        row.appendChild(document.createTextNode(' X: '));
        row.appendChild(inputX);
        row.appendChild(document.createTextNode(' Y: '));
        row.appendChild(inputY);
        container.appendChild(row);
    }

    /**
     * チェックボックスのUIパーツを生成する
     * @param {HTMLElement} container - 追加先のHTML要素
     * @param {string} label - 表示ラベル
     * @param {boolean} initialValue - 初期値 (true/false)
     * @param {function} callback - 値が変更された時に呼び出される関数 (boolean を引数に取る)
     */
    // src/plugins/EditorPlugin.js

        /**
     * チェックボックスのUIパーツを生成する（最終確定版）
     */
    createCheckbox(container, label, initialValue, callback) {
        const row = document.createElement('div');
        const labelEl = document.createElement('label');
        labelEl.innerText = label;
        labelEl.style.width = '160px';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = initialValue;
        
        checkbox.addEventListener('change', () => {
            // チェックボックスの現在の状態をコールバック関数に渡す
            callback(checkbox.checked);
        });

        row.appendChild(labelEl);
        row.appendChild(checkbox);
        container.appendChild(row);
    }
    /**
     * レンジスライダーのUIパーツを生成する
     * @param {HTMLElement} container - 追加先のHTML要素
     * @param {string} label - 表示ラベル
     * @param {number} initialValue - 初期値
     * @param {number} min - 最小値
     * @param {number} max - 最大値
     * @param {number} step - 刻み幅
     * @param {function} callback - 値が変更された時に呼び出される関数 (number を引数に取る)
     */
    createRangeInput(container, label, initialValue, min, max, step, callback) {
        const row = document.createElement('div');
        const labelEl = document.createElement('label');
        labelEl.innerText = label;
        labelEl.style.width = '100px';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = initialValue;
        slider.style.width = '120px';
        
        const valueEl = document.createElement('span');
        valueEl.innerText = initialValue.toFixed(2);

        slider.addEventListener('input', () => {
            const value = parseFloat(slider.value);
            valueEl.innerText = value.toFixed(2);
            callback(value);
        });

        row.appendChild(labelEl);
        row.appendChild(slider);
        row.appendChild(valueEl);
        container.appendChild(row);
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