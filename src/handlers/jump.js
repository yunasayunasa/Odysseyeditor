// src/handlers/jump.js (真の最終確定・完成版)

/**
 * [jump] タグの処理
 * 他のシーンへの遷移、またはファイル内のラベルへのジャンプを行う。
 */
export function handleJump(manager, params) {
    
    if (params.storage) {
        // --- シーン間遷移 ---
        console.log(`[jump] 別シーン[${params.storage}]へジャンプします。`);

        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // ★★★ これが全てを解決する、復活したロジックです ★★★
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // シーンを離れる前に、必ずオートセーブを実行して状態を保存する
        manager.scene.performSave(0);

        // --- 汎用的なパラメータの受け渡し (SystemScene修正版より) ---
        // params.params に含まれるオブジェクトを、そのまま渡すのが最もシンプルで拡張性が高い
        const transitionParams = params.params || {};
        
        // --- SystemSceneに遷移をリクエスト ---
        const fromSceneKey = manager.scene.scene.key; 
        manager.scene.scene.get('SystemScene').events.emit('request-scene-transition', {
            to: params.storage,
            from: fromSceneKey,
            params: transitionParams // 渡すパラメータ
        });
        
        // --- シナリオループを完全に停止 ---
        manager.stop();
        
    } else if (params.target && params.target.startsWith('*')) {
        // --- ファイル内ジャンプ ---
        console.log(`[jump] ラベル[${params.target}]へジャンプします。`);
        manager.jumpTo(params.target);
        
        // ジャンプした後、シナリオの実行を再開する
        manager.next();
        
    } else {
        console.warn('[jump] 有効なstorage属性またはtarget属性が指定されていません。');
    }
}
