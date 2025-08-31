// src/plugins/EditorPlugin.js

export default class EditorPlugin extends Phaser.Plugins.BasePlugin {
    constructor(pluginManager) {
        super(pluginManager);

        this.selectedObject = null;
        this.isDragging = false; // ドラッグ状態を管理するためのフラグ

        // HTMLパネルの要素を取得
        this.editorPanel = document.getElementById('editor-panel');
        this.editorTitle = document.getElementById('editor-title');
        this.editorPropsContainer = document.getElementById('editor-props');
    }

    // プラグインがゲームに追加される時に一度だけ呼ばれるメソッド
    init() {
        console.log('[EditorPlugin] Initialized and ready.');
        if (this.editorPanel) {
            this.editorPanel.style.display = 'block';
        }
    }

     /**
     * ゲームオブジェクトを編集可能にするためのメインメソッド
     * @param {Phaser.GameObjects.GameObject} gameObject - 編集可能にしたいオブジェクト
     * @param {Phaser.Scene} scene - ★★★ この引数が重要 ★★★
     */
    makeEditable(gameObject, scene) {
        // オブジェクトが存在しない、または既に編集可能になっている場合は何もしない
        if (!gameObject || !scene || gameObject.getData('isEditable')) return;
        
        // オブジェクトにインタラクティブ属性を設定
        gameObject.setInteractive();

        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ これがエラーを解決する正しいコードです ★★★
        // ★★★ グローバルな 'game.input' ではなく、          ★★★
        // ★★★ オブジェクトが所属する 'scene.input' を使います   ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        scene.input.setDraggable(gameObject);

        // --- オブジェクトに個別のイベントリスナーを設定 (ここから下は変更なし) ---
        gameObject.on('pointerdown', (pointer) => {
            this.isDragging = false; 
            setTimeout(() => {
                if (!this.isDragging) {
                    this.selectedObject = gameObject;
                    this.updatePropertyPanel();
                }
            }, 100);
        });
        gameObject.on('dragstart', (pointer) => { this.isDragging = true; });
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
    }

    // プラグインがゲームから削除される時に呼ばれるメソッド
    destroy() {
        if (this.editorPanel) {
            this.editorPanel.style.display = 'none';
        }
        // 親クラスのdestroyを呼び出して、クリーンアップを完了させる
        super.destroy();
    }
}