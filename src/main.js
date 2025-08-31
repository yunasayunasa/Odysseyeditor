// src/main.js (直接クラス渡し形式での最終修正 - ステップ1-1)

import PreloadScene from './scenes/PreloadScene.js';
import SystemScene from './scenes/SystemScene.js'; 
import UIScene from './scenes/UIScene.js';       
import GameScene from './scenes/GameScene.js';
import SaveLoadScene from './scenes/SaveLoadScene.js';
import ConfigScene from './scenes/ConfigScene.js';
import BacklogScene from './scenes/BacklogScene.js';
import ActionScene from './scenes/ActionScene.js';
import BattleScene from './scenes/BattleScene.js';
import NovelOverlayScene from './scenes/NovelOverlayScene.js';
import EditorPlugin from './plugins/EditorPlugin.js'; 
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,//開発中のみRESIZEを使用して、"?debug=true&edit"を末尾に貼り付けることでエディタモードに入れます。完成後はFIT推奨です。
        parent: 'game-container', // ゲームキャンバスの親要素IDを指定
        //autoCenter: Phaser.Scale.CENTER_BOTH,//完成後はここの最前コメントアウトを外してください。
        
        width: 1280,
        height: 720
    },
    // ★★★ 修正箇所: シーン設定を直接クラスを渡す形式に維持 ★★★
    scene: [
        PreloadScene, 
        SystemScene, 
        UIScene,       
        GameScene,   
        SaveLoadScene, 
        ConfigScene, 
        BacklogScene, 
        ActionScene,
         BattleScene,
        NovelOverlayScene
    ],
    plugins: {
        global: [
            { key: 'EditorPlugin', plugin: EditorPlugin, start: false }
        ]
    },
    physics: {
        default: 'arcade', // デフォルトの物理エンジンとして 'arcade' を選択
        arcade: {
            gravity: { y: 300 }, // ゲーム全体に適用される標準の重力（y軸方向へ300）
            
            // --- デバッグ設定 ---
            // これをtrueにすると、全ての物理ボディの当たり判定と速度ベクトルが
            // 色付きの線で表示されるようになります。
            // 開発中はtrueにしておき、リリース時にはfalseにするのが一般的です。
            debug: true 
        }
    }
};


const game = new Phaser.Game(config);