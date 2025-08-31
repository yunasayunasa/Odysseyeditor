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
             const layoutData = this.cache.json.get('layout_data');
        const uiLayout = layoutData.UIScene ? layoutData.UIScene.objects : [];
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
                 if (uiElement) {
                uiElement.name = elementDef.name;
                this[elementDef.name] = uiElement;

                // layout.json にこのオブジェクトのデータがあるか探す
                const layout = uiLayout.find(obj => obj.name === elementDef.name);
                if (layout) {
                    // データがあれば、その座標やスケールを適用する
                    uiElement.setPosition(layout.x, layout.y);
                    uiElement.setScale(layout.scaleX, layout.scaleY);
                    uiElement.setAngle(layout.angle);
                    uiElement.setAlpha(layout.alpha);
                }
            }
        }
        
        
     if (this.bottom_panel) {
            // ★★★ 修正点1: パネルのDepthを設定 ★★★
            // 他のUIよりは手前だが、メニューボタンよりは奥に描画する
            this.bottom_panel.setDepth(1); 
        }

        if (this.menu_button) {
            // ★★★ 修正点2: メニューボタンを最前面に設定 ★★★
            this.menu_button.setDepth(2);
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
      /**
     * ゲーム内メニューパネルの器と中身を生成するヘルパーメソッド（イベントリスナーは設定しない）
     * @returns {Phaser.GameObjects.Container} 生成されたパネルコンテナ
     */
    createBottomPanel() {
        const gameWidth = 1280;
        const gameHeight = 720;
        
        // パネルコンテナの基準点を画面中央下部（画面外）に設定
        const panel = this.add.container(gameWidth / 2, gameHeight + 60);
        
        // パネルの背景
        const panelBg = this.add.rectangle(0, 0, gameWidth, 120, 0x000000, 0.8);
        
        // ボタンの共通スタイル
        const buttonStyle = { fontSize: '32px', fill: '#fff' };

        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ ここからが修正箇所です ★★★
        // ★★★ オートボタンとスキップボタンを復活させます ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

        // --- 全てのボタンを生成 ---
        const saveButton = this.add.text(0, 0, 'セーブ', buttonStyle).setOrigin(0.5);
        const loadButton = this.add.text(0, 0, 'ロード', buttonStyle).setOrigin(0.5);
        const backlogButton = this.add.text(0, 0, '履歴', buttonStyle).setOrigin(0.5);
        const configButton = this.add.text(0, 0, '設定', buttonStyle).setOrigin(0.5);
        const autoButton = this.add.text(0, 0, 'オート', buttonStyle).setOrigin(0.5);
        const skipButton = this.add.text(0, 0, 'スキップ', buttonStyle).setOrigin(0.5);
        
        // --- ボタンに、後から参照するための名前を設定 ---
        saveButton.name = 'save_button';
        loadButton.name = 'load_button';
        backlogButton.name = 'backlog_button';
        configButton.name = 'config_button';
        autoButton.name = 'auto_button';
        skipButton.name = 'skip_button';
        
        // --- 生成した全ての要素をパネルコンテナに追加 ---
        panel.add([
            panelBg,
            saveButton, loadButton, backlogButton, configButton, autoButton, skipButton
        ]);

        // --- ボタンのレイアウトを自動計算して配置 ---
        const buttons = [saveButton, loadButton, backlogButton, configButton, autoButton, skipButton];
        
        // MENUボタンの領域を除いた、ボタン配置可能エリアの計算
        const areaStartX = 250;
        const areaEndX = gameWidth - 100;
        const areaWidth = areaEndX - areaStartX;

        // ボタン間のマージンを均等に計算
        const buttonMargin = areaWidth / (buttons.length);

        // 各ボタンを正しいX座標に配置
        buttons.forEach((button, index) => {
            // パネルコンテナの基準点(0,0)からの相対座標で設定
            const buttonX = (areaStartX - gameWidth / 2) + (buttonMargin * index) + (buttonMargin / 2);
            button.setX(buttonX);
        });
        
        return panel;
    }
    
   // src/scenes/UIScene.js

    /**
     * UI要素のイベントリスナーをまとめて設定するヘルパーメソッド（完全版）
     */
    assignEventListeners() {
        // --- メインのMENUボタン ---
        if (this.menu_button) {
            this.menu_button.setInteractive().on('pointerdown', (pointer, localX, localY, event) => {
                this.togglePanel();
                event.stopPropagation();
            });
        }
        
        if (this.bottom_panel) {
            const panelBg = this.bottom_panel.list[0];
            if (panelBg) {
                panelBg.setInteractive().on('pointerdown', (pointer, localX, localY, event) => {
                    event.stopPropagation();
                });
            }

            // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
            // ★★★ ここからが、ボタンの機能を復活させる修正です ★★★
            // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

            const saveButton = this.bottom_panel.list.find(obj => obj.name === 'save_button');
            if(saveButton) {
                saveButton.setInteractive().on('pointerdown', (pointer, localX, localY, event) => {
                    this.openScene('SaveLoadScene', { mode: 'save' });
                    event.stopPropagation();
                });
            }

            const loadButton = this.bottom_panel.list.find(obj => obj.name === 'load_button');
            if(loadButton) {
                loadButton.setInteractive().on('pointerdown', (pointer, localX, localY, event) => {
                    this.openScene('SaveLoadScene', { mode: 'load' });
                    event.stopPropagation();
                });
            }

            const backlogButton = this.bottom_panel.list.find(obj => obj.name === 'backlog_button');
            if(backlogButton) {
                backlogButton.setInteractive().on('pointerdown', (pointer, localX, localY, event) => {
                    this.openScene('BacklogScene');
                    event.stopPropagation();
                });
            }

            const configButton = this.bottom_panel.list.find(obj => obj.name === 'config_button');
            if(configButton) {
                configButton.setInteractive().on('pointerdown', (pointer, localX, localY, event) => {
                    this.openScene('ConfigScene');
                    event.stopPropagation();
                });
            }

            const autoButton = this.bottom_panel.list.find(obj => obj.name === 'auto_button');
            if(autoButton) {
                autoButton.setInteractive().on('pointerdown', (pointer, localX, localY, event) => {
                    this.toggleGameMode('auto');
                    event.stopPropagation();
                });
            }

            const skipButton = this.bottom_panel.list.find(obj => obj.name === 'skip_button');
            if(skipButton) {
                skipButton.setInteractive().on('pointerdown', (pointer, localX, localY, event) => {
                    this.toggleGameMode('skip');
                    event.stopPropagation();
                });
            }
        }
    }

    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
    // ★★★ 以下の2つのメソッドがUISceneに必要です ★★★
    // ★★★ (もし消えていたら、追加してください) ★★★
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

    /**
     * セーブ画面や設定画面などの別シーンをモーダル表示する
     * @param {string} sceneKey - 起動するシーンのキー
     * @param {object} data - シーンに渡すデータ
     */
    openScene(sceneKey, data = {}) {
        // GameSceneが動いているなら、それを一時停止する
        if (this.scene.isActive('GameScene')) {
            this.scene.pause('GameScene');
        }
        // 新しいシーンを起動する
        this.scene.launch(sceneKey, data);
    }
    
    /**
     * オートモードやスキップモードを切り替える
     * @param {string} mode - 'auto' または 'skip'
     */
    toggleGameMode(mode) {
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.scenarioManager) {
            const currentMode = gameScene.scenarioManager.mode;
            // 同じモードが再度クリックされたら'normal'に戻し、違うモードなら新しいモードに設定
            const newMode = currentMode === mode ? 'normal' : mode;
            gameScene.scenarioManager.setMode(newMode);
            console.log(`Game mode set to: ${newMode}`);
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