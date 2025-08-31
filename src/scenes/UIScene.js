// src/scenes/UIScene.js

import { CUSTOM_UI_MAP } from '../ui/index.js';

export default class UIScene extends Phaser.Scene {
    
    constructor() {
        super({ key: 'UIScene' });
        
        this.coin_hud = null;
        this.player_hp_bar = null;
        this.enemy_hp_bar = null;
        this.menu_button = null;
        this.bottom_panel = null;
        
        this.isPanelOpen = false;
    }

    create() {
        console.log("UIScene: データ駆動型アーキテクチャでUIを生成します。");
        this.scene.bringToTop();
        
        const stateManager = this.sys.registry.get('stateManager');
        const uiDefine = this.cache.json.get('ui_define');
        const uiElementsDefine = uiDefine.UIScene.elements;
        
        for (const elementDef of uiElementsDefine) {
            let uiElement = null;
            const params = elementDef.params;
            const type = elementDef.type;
            
            const CustomUIClass = CUSTOM_UI_MAP[type];

            if (CustomUIClass) {
                uiElement = new CustomUIClass(this, { ...params, stateManager });
            } else {
                switch (type) {
                    case 'Text':
                        uiElement = this.add.text(params.x, params.y, params.text, params.style).setOrigin(0.5);
                        break;
                    case 'Panel':
                        // ★★★ 変更点1: ここではパネルの「器」だけを生成する ★★★
                        uiElement = this.createBottomPanel();
                        break;
                    default:
                        console.warn(`[UIScene] ui_define.json で未定義のUIタイプです: ${type}`);
                        continue;
                }
            }
            
            uiElement.name = elementDef.name;
            this[elementDef.name] = uiElement;
        }

        // ★★★ 変更点2: 全てのUI要素が生成された後で、イベントリスナーを一括設定 ★★★
        this.assignEventListeners();

        // --- エディタプラグインに、生成した全てのUIを登録 ---
        if (stateManager.sf.debug_mode) {
            const editor = this.plugins.get('EditorPlugin');
            if (editor) {
                for (const elementDef of uiElementsDefine) {
                    const element = this[elementDef.name];
                    if (element) {
                        if (element instanceof Phaser.GameObjects.Container) {
                             if(element.name === 'bottom_panel') element.setSize(1280, 120);
                             else if(element.name === 'coin_hud') element.setSize(150, 50);
                             else if(element.name === 'player_hp_bar') element.setSize(200, 25);
                             else if(element.name === 'enemy_hp_bar') element.setSize(250, 25);
                        }
                        editor.makeEditable(element, this);
                    }
                }
            }
        }
        
        const systemScene = this.scene.get('SystemScene');
        if (systemScene) {
            systemScene.events.on('transition-complete', this.onSceneTransition, this);
        }
        
        this.input.on('pointerdown', (pointer) => {
            const hitObjects = this.game.input.hitTest(pointer, this.children.list, this.cameras.main);
            if (hitObjects.length === 0) {
                const editor = this.plugins.get('EditorPlugin');
                if (editor) editor.onScenePointerDown();
            }
        });

        console.log("UIScene: UI生成完了");
    }

    /**
     * ゲーム内メニューパネルの器と中身を生成するヘルパーメソッド（イベントリスナーは設定しない）
     * @returns {Phaser.GameObjects.Container} 生成されたパネルコンテナ
     */
    createBottomPanel() {
        const gameWidth = 1280;
        const gameHeight = 720;
        
        const panel = this.add.container(gameWidth / 2, gameHeight + 60);
        const panelBg = this.add.rectangle(0, 0, gameWidth, 120, 0x000000, 0.8);
        
        const buttonStyle = { fontSize: '32px', fill: '#fff' };
        const saveButton = this.add.text(0, 0, 'セーブ', buttonStyle).setOrigin(0.5);
        const loadButton = this.add.text(0, 0, 'ロード', buttonStyle).setOrigin(0.5);
        const backlogButton = this.add.text(0, 0, '履歴', buttonStyle).setOrigin(0.5);
        const configButton = this.add.text(0, 0, '設定', buttonStyle).setOrigin(0.5);
        
        // ★★★ ボタンにも名前をつけておくことで、後からイベントを設定しやすくなる ★★★
        saveButton.name = 'save_button';
        loadButton.name = 'load_button';
        backlogButton.name = 'backlog_button';
        configButton.name = 'config_button';
        
        panel.add([panelBg, saveButton, loadButton, backlogButton, configButton]);

        const buttons = [saveButton, loadButton, backlogButton, configButton];
        const totalWidth = 600;
        const startX = -totalWidth / 2;
        const buttonMargin = totalWidth / (buttons.length - 1);
        
        buttons.forEach((button, index) => {
            button.setX(startX + (buttonMargin * index));
        });
        
        return panel;
    }
    
      /**
     * UI要素のイベントリスナーをまとめて設定するヘルパーメソッド
     */
    assignEventListeners() {
        // --- メインのMENUボタン ---
        if (this.menu_button) {
            this.menu_button.setInteractive().on('pointerdown', (pointer) => {
                this.togglePanel();
                // イベントが背後のオブジェクト（キャラクターなど）に伝わらないようにする
                pointer.stopPropagation();
            });
        }
        
        // --- 下部パネルとその中の要素 ---
        if (this.bottom_panel) {
            // パネルの背景自体をクリックしても、ゲームが反応しないようにする
            const panelBg = this.bottom_panel.list[0]; // listの0番目が背景のrectangle
            if (panelBg) {
                panelBg.setInteractive().on('pointerdown', (pointer) => {
                    pointer.stopPropagation();
                });
            }

            // --- パネル内の各ボタンにイベントを設定 ---
            // 'save_button' という名前を持つオブジェクトを探して、イベントを設定
            const saveButton = this.bottom_panel.list.find(obj => obj.name === 'save_button');
            if(saveButton) {
                saveButton.setInteractive().on('pointerdown', (pointer) => {
                    console.log('Save button clicked');
                    pointer.stopPropagation();
                });
            }

            // 'load_button' という名前を持つオブジェクトを探して、イベントを設定
            const loadButton = this.bottom_panel.list.find(obj => obj.name === 'load_button');
            if(loadButton) {
                loadButton.setInteractive().on('pointerdown', (pointer) => {
                    console.log('Load button clicked');
                    pointer.stopPropagation();
                });
            }

            // 'backlog_button' という名前を持つオブジェクトを探して、イベントを設定
            const backlogButton = this.bottom_panel.list.find(obj => obj.name === 'backlog_button');
            if(backlogButton) {
                backlogButton.setInteractive().on('pointerdown', (pointer) => {
                    console.log('Backlog button clicked');
                    pointer.stopPropagation();
                });
            }

            // 'config_button' という名前を持つオブジェクトを探して、イベントを設定
            const configButton = this.bottom_panel.list.find(obj => obj.name === 'config_button');
            if(configButton) {
                configButton.setInteractive().on('pointerdown', (pointer) => {
                    console.log('Config button clicked');
                    pointer.stopPropagation();
                });
            }
        }
    }
    
    togglePanel() {
        this.isPanelOpen = !this.isPanelOpen;
        const targetY = this.isPanelOpen ? 720 - 60 : 720 + 60;
        
        if (this.bottom_panel) {
            this.tweens.add({
                targets: this.bottom_panel,
                y: targetY,
                duration: 300,
                ease: 'Cubic.easeInOut'
            });
        }
    }

    onSceneTransition(newSceneKey) {
        const isGameScene = (newSceneKey === 'GameScene');
        const isBattleScene = (newSceneKey === 'BattleScene');

        if (this.coin_hud) this.coin_hud.setVisible(isGameScene || isBattleScene);
        if (this.player_hp_bar) this.player_hp_bar.setVisible(isBattleScene); 
        if (this.enemy_hp_bar) this.enemy_hp_bar.setVisible(isBattleScene);
    }

    shutdown() {
        console.log("UIScene: shutdown");
        const systemScene = this.scene.get('SystemScene');
        if (systemScene) {
            systemScene.events.off('transition-complete', this.onSceneTransition, this);
        }
        super.shutdown();
    }
}