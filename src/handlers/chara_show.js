import { Layout } from '../core/Layout.js';

/**
 * [chara_show] タグの処理
 * キャラクターを画面に登場させる
 * @param {ScenarioManager} manager
 * @param {Object} params - { name, face, storage, pos, x, y, time }
 * @returns {Promise<void>}
 */
export function handleCharaShow(manager, params) {
    return new Promise(resolve => {
        const name = params.name;
        if (!name) {
            console.warn('[chara_show] name属性は必須です。');
            resolve();
            return;
        }

        const def = manager.characterDefs[name];
        if (!def) {
            console.warn(`キャラクター[${name}]の定義が見つかりません。`);
            resolve();
            return;
        }

        // --- 1. 表示する画像(storage)を決定 ---
        const face = params.face || 'normal';
        const storage = def.face[face];
        if (!storage) {
            console.warn(`キャラクター[${name}]の表情[${face}]のstorageが見つかりません。`);
            resolve();
            return;
        }

        // --- 2. 座標を決定 ---
        let x, y;
        const pos = params.pos;
        const orientation = manager.scene.scale.isPortrait ? 'portrait' : 'landscape';

        if (pos && Layout[orientation].character[pos]) {
            x = Layout[orientation].character[pos].x;
            y = Layout[orientation].character[pos].y;
        } else {
            x = Layout[orientation].character.center.x;
            y = Layout[orientation].character.center.y;
        }

        if (params.x !== undefined) x = Number(params.x);
        if (params.y !== undefined) y = Number(params.y);

        // --- 3. 表示処理 ---
        // 既に同名のキャラクターがいれば、上書きする前に破棄する
        if (manager.scene.characters[name]) {
            manager.scene.characters[name].destroy();
        }
    const layoutData = manager.scene.cache.json.get('layout_data');
        const gameLayout = layoutData.GameScene ? layoutData.GameScene.objects : [];
        const layout = gameLayout.find(obj => obj.name === params.name);

        // --- 3. 表示処理 ---
        const chara = manager.scene.add.image(x, y, storage); // まずはデフォルト位置で生成
        chara.name = params.name;

        if (layout) {
            // レイアウトデータがあれば、その情報で上書き
            chara.setPosition(layout.x, layout.y);
            chara.setScale(layout.scaleX, layout.scaleY);
            chara.setAngle(layout.angle);
            chara.setAlpha(0); // フェードインのために一度透明にする
        } else {
            // なければアルファだけ設定
            chara.setAlpha(0);
        }

        manager.layers.character.add(chara);
        manager.scene.characters[params.name] = chara;
  const stateManager = manager.scene.sys.registry.get('stateManager');
    if (stateManager.sf.debug_mode) {
        const editor = manager.scene.plugins.get('EditorPlugin');

        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ ここが修正箇所です ★★★
        // ★★★ 第2引数に、GameSceneのインスタンス (manager.scene) を渡します ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
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