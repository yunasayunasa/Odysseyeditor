// src/ui/index.js (新規作成)

/**
 * このファイルは、ゲーム内で使用するカスタムUIクラスの「カタログ」です。
 * 新しいUIクラスを作成したら、ここに追加するだけで、
 * UISceneが自動的に認識できるようになります。
 */

// 1. 管理したいカスタムUIクラスをすべてインポートします
import CoinHud from './CoinHud.js';
import HpBar from './HpBar.js';
// import MpBar from './MpBar.js'; // 将来、新しいUIクラスを追加する場合の例

// 2. ui_define.json の "type" 文字列と、実際のクラスを結びつける対応表を作成します
export const CUSTOM_UI_MAP = {
    'CoinHud': CoinHud,
    'HpBar': HpBar,
    // 'MpBar': MpBar, // 将来、新しいUIクラスを追加する場合の例
};