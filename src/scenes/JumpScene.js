
import BaseGameScene from './BaseGameScene.js'; // ★ インポート

export default class JumpScene extends BaseGameScene { // ★ 継承元を変更
    constructor() {
        super({ key: 'JumpScene' });
        
        // このシーンで使うプロパティを初期化
        this.player = null;
        this.cursors = null;
    }

    /**
     * シーンが起動する時に、SystemSceneから渡されたデータを受け取る
     */
    init(data) {
        console.log(`[JumpScene] Initialized with data:`, data);
        // data.params など、必要に応じて受け取る
    }
    
    /**
     * 必要なアセットを、このシーン専用にロードする
     */
    preload() {
        // このシーンで使うアセットをロード
        // (PreloadSceneで全ロード済みなら、ここは空でも良いが、
        //  シーンごとに必要なアセットを明記するのが良い設計)
        this.load.image('player_char', 'assets/images/player_placeholder.png'); // 仮のプレイヤー画像
        this.load.image('ground_tile', 'assets/images/ground_placeholder.png'); // 仮の地面画像
    }

    /**
     * シーンが作成される時のメイン処理
     */
    create() {
        // --- 1. シーン固有の初期化 ---
        console.log("[JumpScene] Create started.");
        this.applyLayoutAndPhysics();
        // カメラの背景色を設定
        this.cameras.main.setBackgroundColor('#4488cc');
        
        // プレイヤー操作のためのカーソルキーを準備
        this.cursors = this.input.keyboard.createCursorKeys();

        // --- 2. 汎用初期化ルーチンによるレイアウト適用 ---
        const sceneKey = this.scene.key; // 'JumpScene'
        const layoutFilePath = `assets/data/scenes/${sceneKey}.json`;

        // 対応するJSONファイルの存在をチェック
        if (this.cache.json.has(sceneKey)) {
             // 既にロード済みなら、即座に適用
             this.applyLayoutAndPhysics(sceneKey);
        } else {
            // まだロードされていなければ、ロードしてから適用
            this.load.json(sceneKey, layoutFilePath);
            this.load.once(`filecomplete-json-${sceneKey}`, () => {
                this.applyLayoutAndPhysics(sceneKey);
            });
            this.load.start();
        }
        
        // ★★★ 開発の5ヶ条: 第2条 - BGMはcreateで再生 ★★★
        const soundManager = this.registry.get('soundManager');
        soundManager.playBgm('bgm_action'); // 仮のBGMキー
    }
  /**
     * JumpScene専用の最終セットアップ
     */
    finalizeSetup() {
        // playerへの参照を保持
        this.player = this.children.list.find(obj => obj.name === 'player');

        const floors = this.children.list.filter(obj => obj.name.startsWith('ground'));
        if (this.player && floors.length > 0) {
            this.physics.add.collider(this.player, floors);
        }
        
        // ★★★ 最後に親の finalizeSetup を呼び出して 'scene-ready' を発行 ★★★
        super.finalizeSetup();
    }
    /**
     * 汎用初期化ルーチン：シーンキーと同じ名前のJSONからレイアウトと物理を適用
     * @param {string} sceneKey - 適用するデータのキー (e.g., 'JumpScene')
     */
    applyLayoutAndPhysics(sceneKey) {
        const layoutData = this.cache.json.get(sceneKey);
        if (!layoutData || !layoutData.objects) {
            console.warn(`[${sceneKey}] Layout data is empty or invalid.`);
            this.finalizeSetup(); // データがなくてもセットアップの最終段階へ
            return;
        }

        console.log(`[${sceneKey}] Applying layout and physics from ${sceneKey}.json...`);
        
        for (const layout of layoutData.objects) {
            // シーン内に同名オブジェクトがなければ、新規生成
            // (このシーンは空から作るので、常に新規生成される)
            const gameObject = this.add.image(layout.x, layout.y, layout.texture || layout.name.split('_')[0]);
            gameObject.name = layout.name;

            // Transform適用
            gameObject.setPosition(layout.x, layout.y);
            gameObject.setScale(layout.scaleX, layout.scaleY);
            gameObject.setAngle(layout.angle);
            gameObject.setAlpha(layout.alpha);
            
            // 物理プロパティ適用
            if (layout.physics) {
                this.physics.add.existing(gameObject, layout.physics.isStatic);
                if (gameObject.body) {
                    const phys = layout.physics;
                    gameObject.body.setSize(phys.width, phys.height);
                    gameObject.body.setOffset(phys.offsetX, phys.offsetY);
                    gameObject.body.allowGravity = phys.allowGravity;
                    gameObject.body.bounce.setTo(phys.bounceX, phys.bounceY);
                    gameObject.body.collideWorldBounds = phys.collideWorldBounds;
                }
            }

            // プレイヤーオブジェクトへの参照を保持
            if (layout.name === 'player') {
                this.player = gameObject;
            }

            // エディタに登録
            const editor = this.plugins.get('EditorPlugin');
            if (editor) {
                editor.makeEditable(gameObject, this);
            }
        }
        
        this.finalizeSetup(); // レイアウト適用後にセットアップの最終段階へ
    }
    
    /**
     * レイアウト適用後に行う、シーンの最終セットアップ
     */
    finalizeSetup() {
        // --- 衝突判定の定義 ---
        // (将来的に、これもJSONから定義できるように拡張する)
        const floors = this.children.list.filter(obj => obj.name.startsWith('ground'));
        if (this.player && floors.length > 0) {
            this.physics.add.collider(this.player, floors);
        }

        // ★★★ 開発の5ヶ条: 第1条 - createの最後にscene-readyを発行 ★★★
        this.events.emit('scene-ready');
        console.log("[JumpScene] Setup complete. Scene is ready.");
    }
    
    /**
     * 毎フレーム呼び出される更新処理
     */
    update(time, delta) {
        if (!this.player || !this.player.body) return;

        // --- プレイヤーの操作 ---
        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-160);
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(160);
        } else {
            this.player.body.setVelocityX(0);
        }

        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.body.setVelocityY(-330); // ジャンプ！
        }
        
        // --- ゲーム終了条件のチェック (仮) ---
        if (this.player.y > 720) { // 画面下に落ちたら
            // ★★★ 開発の5ヶ条: 第3条 - ノベル復帰はSystemSceneに依頼 ★★★
            this.scene.get('SystemScene').events.emit('return-to-novel', {
                params: { 'f.game_over': true } // 何かパラメータを渡す
            });
        }
    }

    /**
     * シーンが破棄される時の後片付け
     */
    shutdown() {
        // ★★★ 開発の5ヶ条: 第4条 - shutdownで後片付け ★★★
        // このシーンで独自に作成したイベントリスナーやタイマーがあれば、ここで解除する
        // (今回は特にないので、記述は不要だが、メソッド自体は用意しておくのが良い習慣)
        console.log("[JumpScene] Shutdown.");
        super.shutdown();
    }

    // ★★★ 開発の5ヶ条: 第5条 - HUDは操作しない ★★★
    // このシーンは、UISceneのHPバーなどを直接操作しない。
    // HPが減るなどのイベントは stateManager.setF('player_hp', ...) で通知する。
}