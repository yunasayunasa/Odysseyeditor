import SoundManager from '../core/SoundManager.js';
import EditorUI from '../editor/EditorUI.js'; // ★ インポート

export default class SystemScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SystemScene' });
        this.globalCharaDefs = null;
        this.isProcessingTransition = false;
        this.initialGameData = null;
         // ★★★ ノベルシーンのBGM情報を一時的に保持する場所 ★★★
        this.novelBgmKey = null;
    }

    init(data) {
        if (data && data.initialGameData) {
            this.initialGameData = data.initialGameData;
        }
    }

    create() {
        console.log("SystemScene: 起動・グローバルサービスのセットアップを開始。");
 
          const soundManager = new SoundManager(this.game);
        this.sys.registry.set('soundManager', soundManager);
        this.input.once('pointerdown', () => soundManager.resumeContext(), this);
        console.log("SystemScene: SoundManagerを生成・登録しました。");

        // --- イベントリスナーを登録 ---
        this.events.on('request-scene-transition', this._handleRequestSceneTransition, this);
        this.events.on('return-to-novel', this._handleReturnToNovel, this);
        this.events.on('request-overlay', this._handleRequestOverlay, this);
        this.events.on('end-overlay', this._handleEndOverlay, this);
        const stateManager = this.registry.get('stateManager');
   
        // ★★★ PreloadSceneから渡されたデータで初期ゲームを起動 ★★★
        if (this.initialGameData) {
            this._startInitialGame(this.initialGameData);
        }

    if (stateManager.sf.debug_mode) {
        const editorPlugin = this.plugins.start('EditorPlugin'); // プラグインを起動
        
        // ★★★ EditorUIをnewし、gameインスタンスとpluginインスタンスを渡す ★★★
        new EditorUI(this.game, editorPlugin);
    }
}

    /**
     * 初期ゲームを起動する内部メソッド
     * @param {object} initialData - PreloadSceneから渡されたデータ
     */
    _startInitialGame(initialData) {
        this.globalCharaDefs = initialData.charaDefs;
        console.log(`[SystemScene] 初期ゲーム起動リクエストを受信。`);
        this.scene.launch('UIScene');
        this._startAndMonitorScene('GameScene', {
            charaDefs: this.globalCharaDefs,
            startScenario: initialData.startScenario,
            startLabel: null,
        });
    }
    
       /**
     * [jump]などによるシーン遷移リクエストを処理する（汎用版）
     */
 // src/scenes/SystemScene.js

    _handleRequestSceneTransition(data) {
        console.log(`[SystemScene] シーン遷移リクエスト: ${data.from} -> ${data.to}`);
        
        const fromSceneKey = data.from;
        const toSceneKey = data.to;

        if (this.scene.isActive(fromSceneKey)) {
            // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
            // ★★★ これが全てを解決する、最後のアーキテクチャ修正です ★★★
            // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
            
            // 1. まず、'from'シーンの'shutdown'イベントを一度だけ監視する
            const fromScene = this.scene.get(fromSceneKey);
            fromScene.events.once('shutdown', () => {
                console.log(`[SystemScene] シーン[${fromSceneKey}]のシャットダウンを検知。`);
                
                // 2. シャットダウンが完了した「後」で、次のシーンの起動を開始する
                if (this.scene.isActive('UIScene')) {
                    // JumpSceneなどに遷移する場合は、UISceneを非表示にする
                    // (このロジックは、遷移先がGameScene以外の場合に適用)
                    const isReturningToNovel = (toSceneKey === 'GameScene');
                    this.scene.get('UIScene').setVisible(isReturningToNovel);
                }
                
                // 3. 次のシーンを、安全なタイミングで起動・監視する
                this._startAndMonitorScene(toSceneKey, data.params || {});
            });

            // 4. 全ての準備が整った後で、シーンの停止を「命令」する
            this.scene.stop(fromSceneKey); 

        } else {
            // もし'from'シーンがアクティブでなければ、直接次のシーンを開始
            this._startAndMonitorScene(toSceneKey, data.params || {});
        }
    };
}
   // src/scenes/SystemScene.js

    /**
     * オーバーレイ表示のリクエストを処理 (入力制御オプション付き)
     * @param {object} data - { from: string, scenario: string, block_input: boolean }
     */
    _handleRequestOverlay(data) {
        console.log(`[SystemScene] オーバーレイ表示リクエストを受信 (from: ${data.from})`);

        // block_inputパラメータをチェック。指定がないか、falseでない場合はtrue（入力をブロックする）
        const shouldBlockInput = (data.block_input !== false);

        if (shouldBlockInput) {
            const fromScene = this.scene.get(data.from);
            if (fromScene && fromScene.scene.isActive()) {
                fromScene.input.enabled = false;
                console.log(`[SystemScene] 背後のシーン[${data.from}]の入力を無効化しました。`);
            }
        } else {
            console.log(`[SystemScene] 背後のシーン[${data.from}]の入力は有効のままです。`);
        }

        // NovelOverlaySceneを起動し、入力ブロックの有無を伝える
        this.scene.launch('NovelOverlayScene', { 
            scenario: data.scenario,
            charaDefs: this.globalCharaDefs,
            returnTo: data.from,
            inputWasBlocked: shouldBlockInput 
        });
    }

    /**
     * オーバーレイ終了のリクエストを処理 (入力制御オプション付き)
     * @param {object} data - { from: 'NovelOverlayScene', returnTo: string, inputWasBlocked: boolean }
     */
    _handleEndOverlay(data) {
        console.log(`[SystemScene] オーバーレイ終了リクエストを受信 (return to: ${data.returnTo})`);

        // NovelOverlaySceneを停止
        if (this.scene.isActive(data.from)) {
            this.scene.stop(data.from); 
        }

        // 入力をブロック「していた」場合のみ、再度有効化する
        if (data.inputWasBlocked) {
            const returnScene = this.scene.get(data.returnTo);
            if (returnScene && returnScene.scene.isActive()) { 
                returnScene.input.enabled = true; 
                console.log(`[SystemScene] シーン[${data.returnTo}]の入力を再有効化しました。`);
            }
        } else {
             console.log(`[SystemScene] シーン[${data.returnTo}]の入力はもともと有効だったので、何もしません。`);
        }
    }

// ... SystemScene.js の他のメソッド ...
      /**
     * ★★★ 新しいシーンを起動し、完了まで監視するコアメソッド (最終確定版) ★★★
     * @param {string} sceneKey - 起動するシーンのキー
     * @param {object} params - シーンに渡すデータ
     */
     /**
     * ★★★ 新しいシーンを起動し、完了まで監視するコアメソッド (真・最終確定版) ★★★
     * @param {string} sceneKey - 起動するシーンのキー
     * @param {object} params - シーンに渡すデータ
     */
  // src/scenes/SystemScene.js

    _startAndMonitorScene(sceneKey, params) {
        if (this.isProcessingTransition) {
            console.warn(`[SystemScene] 遷移処理中に新たな遷移リクエストが無視されました。`);
            return;
        }

        this.isProcessingTransition = true;
        this.game.input.enabled = false;
        console.log(`[SystemScene] シーン[${sceneKey}]の起動を開始。`);
        this.tweens.killAll();

        const targetScene = this.scene.get(sceneKey);
        
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ これが、あなたのエンジン本来の正しい姿です ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        
        // もし、起動するのがGameSceneなら、特別な完了イベントを待つ
        if (sceneKey === 'GameScene') {
            targetScene.events.once('gameScene-load-complete', () => {
                this._onTransitionComplete(sceneKey);
            });
        } else {
            // それ以外のシーン (JumpSceneなど) なら、共通の 'scene-ready' を待つ
            targetScene.events.once('scene-ready', () => {
                this._onTransitionComplete(sceneKey);
            });
        }

        // リスナーを登録した後に、シーンを起動
        this.scene.run(sceneKey, params);
    }
     
    /**
     * シーン遷移が完全に完了したときの処理
     * @param {string} sceneKey - 完了したシーンのキー
     */
    _onTransitionComplete(sceneKey) {
        this.isProcessingTransition = false;
        this.game.input.enabled = true;
        console.log(`[SystemScene] シーン[${sceneKey}]の遷移が完了。ゲーム全体の入力を再有効化。`);
        this.events.emit('transition-complete', sceneKey);
    }
}



