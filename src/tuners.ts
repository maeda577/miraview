import { loadConfigFromStorage, escapeHtml } from './utils/localconfig.ts';
import { defineNavDrawer } from './utils/navdrawer.ts';
import { defineNavbar } from './utils/navbar.ts';
import createClient from 'openapi-fetch';
import type { components, paths } from './utils/mirakc.d.ts';

import {
  defineComponents,
  StyleVariant,
  IgcButtonComponent,
  IgcExpansionPanelComponent,
  IgcBadgeComponent,
  IgcCircularProgressComponent,
} from 'igniteui-webcomponents';

// 使用する Ignite UI コンポーネントの登録
defineComponents(
  IgcButtonComponent,
  IgcExpansionPanelComponent,
  IgcBadgeComponent,
  IgcCircularProgressComponent,
);

defineNavDrawer();
defineNavbar();

// 保存されている設定からテーマを反映
loadConfigFromStorage().applyTheme();

// ローディングがたつき防止解除
document.body.style.visibility = 'visible';

// チューナー一覧を取得
async function getTuners() {
  const client = createClient<paths>({ baseUrl: loadConfigFromStorage().getApiEndpoint().href });
  try {
    const response = await client.GET("/tuners");
    return response.data;
  } catch (error) {
    window.alert("チューナー情報の取得に失敗しました。\nmirakc APIエンドポイントの指定を確認してください。エンドポイントを変更している場合、CORSが無効化されているかも確認してください。\nまた、ブラウザのコンソールにエラーが出ていないか確認してください。");
    throw error;
  }
}

// チューナーの利用状況に応じてバッジのバリアントを判定
function getVariant(tuner: components['schemas']['MirakurunTuner']): StyleVariant {
  if (tuner.isFree) {
    return 'success';
  } else if (Math.max(...tuner.users.map(u => u.priority)) <= 0) {
    return 'warning';
  } else {
    return 'danger';
  }
}


// チューナーパネルのHTML生成
function createTunerPanel(tuner: components['schemas']['MirakurunTuner']) {
  const badgeVariant = getVariant(tuner);
  const badgeText = tuner.isFree ? 'Free' : 'Using';

  // ユーザー情報の構築
  let usersHtml = '';
  if (tuner.users && tuner.users.length > 0) {
    usersHtml = tuner.users.map((user, idx) => `
      ${idx > 0 ? '<hr class="user-divider" />' : ''}
      <dt>User ID</dt>
      <dd>${escapeHtml(user.id)}</dd>
      <dt>Priority</dt>
      <dd>${user.priority}</dd>
      ${user.agent ? `<dt>User Agent</dt><dd>${escapeHtml(user.agent)}</dd>` : ''}
    `).join('');
  }

  // 実行コマンドの構築
  const commandHtml = tuner.command ? `
    <dt>Command</dt>
    <dd>${escapeHtml(tuner.command)}</dd>
  ` : '';

  // コンテンツ領域の構築（使用中でない場合はその旨を表示）
  let contentHtml = '';
  if (commandHtml || usersHtml) {
    contentHtml = `
      <dl class="tuner-details">
        ${commandHtml}
        ${usersHtml ? `<hr class="user-divider" />${usersHtml}` : ''}
      </dl>
    `;
  } else {
    contentHtml = `
      <div style="padding: 1rem; color: var(--ig-gray-500); font-style: italic; font-size: var(--ig-body-medium-font-size);">
        現在使用されていません。
      </div>
    `;
  }

  return `
    <igc-expansion-panel>
      <div slot="title" style="display: flex; align-items: center; gap: 0.75rem;">
        <igc-badge variant="${badgeVariant}">${badgeText}</igc-badge>
        <strong>${escapeHtml(tuner.name)}</strong>
      </div>
      <span slot="subtitle">${escapeHtml(tuner.types.join(' : '))}</span>
      <div>
        ${contentHtml}
      </div>
    </igc-expansion-panel>
  `;
}

const tunerList = document.getElementById('tuner-list')!;
const spinner = document.getElementById('loading-spinner') as IgcCircularProgressComponent;
const btnRefresh = document.getElementById('button-refresh')!;

// 画面更新処理
async function refreshTuners() {
  tunerList.innerHTML = '';
  spinner.style.display = 'block';
  btnRefresh.setAttribute('disabled', 'true');

  try {
    const tuners = await getTuners();
    if (tuners && tuners.length > 0) {
      const panelsHtml = tuners.map(createTunerPanel).join('');
      tunerList.innerHTML = panelsHtml;
    } else {
      tunerList.innerHTML = '<p>チューナー情報がありません。</p>';
    }
  } catch (error) {
    tunerList.innerHTML = '<p>データの取得中にエラーが発生しました。</p>';
    console.error(error);
  } finally {
    spinner.style.display = 'none';
    btnRefresh.removeAttribute('disabled');
  }
}

// 初期化表示
refreshTuners();

// 更新イベント割り当て
btnRefresh.addEventListener('click', refreshTuners);
