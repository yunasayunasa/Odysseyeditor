
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
        console.log("[JumpScene] Create started.");
        this.cameras.main.setBackgroundColor('#4488cc');
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // ★★★ 親の汎用ルーチンを呼び出すだけ！ ★★★
        this.applyLayoutAndPhysics();
    }
/**
     * JumpScene専用の最終セットアップ
     */
    finalizeSetup() {
        // playerへの参照を保持 (applyProperties は親がやってくれるので、ここでは参照を取るだけ)
        this.player = this.children.list.find(obj => obj.name === 'player');

        // 衝突判定
        const floors = this.children.list.filter(obj => obj.name.startsWith('ground'));
        if (this.player && floors.length > 0) {
            this.physics.add.collider(this.player, floors);
        }
        
        // 最後に必ず親の finalizeSetup を呼び出して 'scene-ready' を発行
        super.finalizeSetup();
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