// src/scenes/UIScene.js

import { CUSTOM_UI_MAP } from '../ui/index.js';
import BaseGameScene from './BaseGameScene.js';

export default class UIScene extends BaseGameScene {
    
    constructor() {
        super({ key: 'UIScene' });
        this.isPanelOpen = false;
    }

    create() {
        console.log("UIScene: create started.");
        this.scene.bringToTop();
        
        // ★★★ 親の汎用ルーチンを呼び出すだけ！ ★★★
        // これが UIScene.json を読み込み、buildSceneFromLayout を呼び出してくれる
        this.applyLayoutAndPhysics();
    }

    /**
     * UIScene専用のオブジェクト生成ロジック
     * (BaseGameSceneのメソッドをオーバーライド)
     */
    createObjectFromLayout(layout) {
        let uiElement = null;
        const stateManager = this.registry.get('stateManager');
        const CustomUIClass = CUSTOM_UI_MAP[layout.type];

        if (CustomUIClass) {
            uiElement = new CustomUIClass(this, { ...layout.params, stateManager });
        } else {
            switch (layout.type) {
                case 'Text':
                    uiElement = this.add.text(layout.x, layout.y, layout.params.text, layout.params.style).setOrigin(0.5);
                    break;
                case 'Panel':
                    uiElement = this.createBottomPanel();
                    break;
            }
        }

        if (uiElement) {
            // 親のapplyPropertiesを呼び出す前に、シーンのプロパティとして登録
            this[layout.name] = uiElement;
        }

        return uiElement; // 生成したオブジェクトを親に返す
    }
    
    /**
     * UIScene専用の最終セットアップ
     * (BaseGameSceneのメソッドをオーバーライド)
     */
    finalizeSetup() {
        // 全てのオブジェクトが生成された後に、イベントリスナーとDepthを設定
        this.assignEventListeners();
        
        if (this.bottom_panel) this.bottom_panel.setDepth(1);
        if (this.menu_button) this.menu_button.setDepth(2);

        const systemScene = this.scene.get('SystemScene');
        if (systemScene) {
            systemScene.events.on('transition-complete', this.onSceneTransition, this);
        }

        // UISceneはSystemSceneに直接管理されるので、'scene-ready'は発行しない
        console.log(`[${this.scene.key}] Setup complete.`);
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

        /**
     * ★★★ 新規メソッド: UIScene専用のオブジェクト生成ロジック ★★★
     * (BaseGameSceneのメソッドをオーバーライド)
     */
    createObjectFromLayout(layout) {
        let uiElement = null;
        const stateManager = this.registry.get('stateManager');
        const CustomUIClass = CUSTOM_UI_MAP[layout.type];

        if (CustomUIClass) {
            uiElement = new CustomUIClass(this, { ...layout.params, stateManager });
        } else {
            switch (layout.type) {
                case 'Text':
                    uiElement = this.add.text(layout.x, layout.y, layout.params.text, layout.params.style).setOrigin(0.5);
                    break;
                case 'Panel':
                    uiElement = this.createBottomPanel();
                    break;
            }
        }

        if (uiElement) {
            uiElement.name = layout.name;
            this[layout.name] = uiElement;
            
            // TransformとEditor登録は親クラスのメソッドを再利用
            super.createObjectFromLayout(layout);
        }
    }
    
    /**
     * ★★★ 変更点: UIScene専用の最終セットアップ ★★★
     * (BaseGameSceneのメソッドをオーバーライド)
     */
    finalizeSetup() {
        this.assignEventListeners();
        
        const systemScene = this.scene.get('SystemScene');
        if (systemScene) {
            systemScene.events.on('transition-complete', this.onSceneTransition, this);
        }

        // UISceneはSystemSceneに直接管理されるので、'scene-ready'は発行しない
        console.log(`[${this.scene.key}] Setup complete.`);
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
