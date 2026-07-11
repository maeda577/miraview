import { loadConfigFromStorage } from './utils/localconfig.ts';
import { defineNavDrawer } from './utils/navdrawer.ts';
import { defineNavbar } from './utils/navbar.ts';
import createClient from 'openapi-fetch';
import type { components, paths } from './utils/mirakc.d.ts';

import {
  defineComponents,
  IgcButtonComponent,
  IgcCardComponent,
  IgcCardHeaderComponent,
  IgcCardContentComponent,
  IgcBadgeComponent,
  IgcCircularProgressComponent,
} from 'igniteui-webcomponents';

// 使用する Ignite UI コンポーネントの登録
defineComponents(
  IgcButtonComponent,
  IgcCardComponent,
  IgcCardHeaderComponent,
  IgcCardContentComponent,
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
    console.error("Failed to fetch tuners:", error);
    return undefined;
  }
}

// チューナーの利用状況に応じてバッジのバリアントを判定
function getVariant(tuner: components['schemas']['MirakurunTuner']) {
  if (tuner.isFree) {
    return 'success';
  } else if (Math.max(...tuner.users.map(u => u.priority)) <= 0) {
    return 'warning';
  } else {
    return 'danger';
  }
}

// HTMLエスケープ処理
function escapeHtml(str: string): string {
  return str.replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// チューナーカードのHTML生成
function createTunerCard(tuner: components['schemas']['MirakurunTuner']) {
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

  return `
    <igc-card>
      <igc-card-header>
        <igc-badge slot="thumbnail" variant="${badgeVariant}">${badgeText}</igc-badge>
        <h3 slot="title">${escapeHtml(tuner.name)}</h3>
        <span slot="subtitle">${escapeHtml(tuner.types.join(' : '))}</span>
      </igc-card-header>
      <igc-card-content>
        <dl class="tuner-details">
          ${commandHtml}
          ${usersHtml ? `<hr class="user-divider" />${usersHtml}` : ''}
        </dl>
      </igc-card-content>
    </igc-card>
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
      const cardsHtml = tuners.map(createTunerCard).join('');
      tunerList.innerHTML = cardsHtml;
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
