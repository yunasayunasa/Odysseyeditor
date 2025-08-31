// src/handlers/chara_show.js (最終確定・完成版)

import { Layout } from '../core/Layout.js';

export function handleCharaShow(manager, params) {
    return new Promise(resolve => {
        const name = params.name;
        if (!name) {
            console.warn('[chara_show] name属性は必須です。');
            resolve();
            return;
        }
        
        // --- 1. 表示する画像(storage)を決定 ---
        const def = manager.characterDefs[name];
        let storage = params.storage;
        if (!storage && def) {
            const face = params.face || 'normal';
            storage = def.face[face];
        }
        if (!storage) {
            console.warn(`[chara_show] 表示するstorageが見つかりません: name=${name}`);
            resolve();
            return;
        }

        // --- 2. 座標を決定 ---
        let x, y;
        const sceneKey = manager.scene.scene.key; // 現在のシーンキーを取得 (e.g., 'GameScene')
        
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ これが古いコードを置き換える、新しいロジックです ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        
        // 2-1. まず、対応するシーンのJSONデータからレイアウトを探す
        const layoutData = manager.scene.cache.json.get(sceneKey);
        const layout = (layoutData && layoutData.objects) ? layoutData.objects.find(obj => obj.name === name) : null;
        
        if (layout) {
            // 2-2. レイアウトデータがあれば、それを最優先で使う
            x = layout.x;
            y = layout.y;
        } else {
            // 2-3. なければ、タグの指定やデフォルト値を使う
            const pos = params.pos;
            const orientation = manager.scene.scale.isPortrait ? 'portrait' : 'landscape';
            if (pos && Layout[orientation].character[pos]) {
                x = Layout[orientation].character[pos].x;
                y = Layout[orientation].character[pos].y;
            } else {
                x = Layout[orientation].character.center.x;
                y = Layout[orientation].character.center.y;
            }
        }
        
        // 2-4. タグに直接 x, y 指定があれば、さらにそれを上書きする（演出用）
        if (params.x !== undefined) x = Number(params.x);
        if (params.y !== undefined) y = Number(params.y);
        
        // --- 3. 表示処理 ---
        if (manager.scene.characters[name]) {
            manager.scene.characters[name].destroy();
        }

        // ★★★ 変更点: シーンに「既に存在する」オブジェクトを探す ★★★
        let chara = manager.scene.layer.character.list.find(c => c.name === name);

        if (chara) {
            // 既にJSONで生成済みなら、テクスチャと位置を更新
            chara.setTexture(storage);
            chara.setPosition(x, y);
            chara.setVisible(true); // 表示状態にする
            console.log(`[chara_show] Updated existing character: ${name}`);
        } else {
            // 存在しなければ、新規に生成
            chara = manager.scene.add.image(x, y, storage);
            chara.name = name;
            manager.scene.layer.character.add(chara);
            console.log(`[chara_show] Created new character: ${name}`);
        }
        
        manager.scene.characters[name] = chara;
        chara.setAlpha(0); // フェードインのために一度透明に

        // エディタ登録処理 (変更なし)
        const editor = manager.scene.plugins.get('EditorPlugin');
        if (editor) {
            editor.makeEditable(chara, manager.scene);
        }

        // --- 4. アニメーション ---
        const time = Number(params.time) || 0;

        if (time > 0) {
            manager.scene.tweens.add({
                targets: chara,
                alpha: 1,
                duration: time,
                ease: 'Linear',
                onComplete: () => resolve() // アニメーション完了時に完了を通知
            });
        } else {
            chara.setAlpha(1);
            resolve(); // 即座に完了を通知
        }
    });
}