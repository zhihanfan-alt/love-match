export class HelpPanel {
  private container: HTMLDivElement;
  private isOpen: boolean = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'help-panel';
    this.container.style.display = 'none';
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="help-content">
        <div class="help-header">
          <h2>游戏说明</h2>
          <button class="close-btn" id="close-help">×</button>
        </div>

        <div class="help-section">
          <h3>基本玩法</h3>
          <p>点击卡牌放入底部卡槽，<strong>3个相同图案</strong>自动消除！</p>
          <p>消除所有卡牌即可过关，卡槽满则游戏结束！</p>
        </div>

        <div class="help-section">
          <h3>关卡难度</h3>
          <div class="prop-list">
            <div class="prop-item">
              <span class="prop-icon">💚</span>
              <div class="prop-info">
                <strong>心动</strong>
                <p>5层堆叠 · 8种图案 · 7格卡槽 · 无限时</p>
              </div>
            </div>
            <div class="prop-item">
              <span class="prop-icon">🧡</span>
              <div class="prop-info">
                <strong>情深</strong>
                <p>6层堆叠 · 8种图案 · 6格卡槽 · 5分钟限时 · 道具减半</p>
              </div>
            </div>
            <div class="prop-item">
              <span class="prop-icon">💜</span>
              <div class="prop-info">
                <strong>永恒</strong>
                <p>7层堆叠 · 8种图案 · 5格卡槽 · 4分钟限时 · 道具极少</p>
              </div>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h3>道具说明</h3>
          <div class="prop-list">
            <div class="prop-item">
              <span class="prop-icon">🌹</span>
              <div class="prop-info">
                <strong>时光倒流</strong>
                <p>撤销上一步操作，将卡牌放回原位</p>
              </div>
            </div>
            <div class="prop-item">
              <span class="prop-icon">🌸</span>
              <div class="prop-info">
                <strong>命运洗牌</strong>
                <p>重新打乱所有卡牌位置</p>
              </div>
            </div>
            <div class="prop-item">
              <span class="prop-icon">💕</span>
              <div class="prop-info">
                <strong>移形换影</strong>
                <p>移除卡槽中3张卡牌</p>
              </div>
            </div>
            <div class="prop-item">
              <span class="prop-icon">⭐</span>
              <div class="prop-info">
                <strong>灵犀一点</strong>
                <p>高亮提示可消除的卡牌</p>
              </div>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h3>彩蛋系统</h3>
          <div class="easter-egg-list">
            <div class="easter-egg-item">
              <span>💕</span>
              <p>消除3张爱心牌 → 爱心雨</p>
            </div>
            <div class="easter-egg-item">
              <span>😘</span>
              <p>消除3张亲吻牌 → 烟花特效</p>
            </div>
            <div class="easter-egg-item">
              <span>🌹</span>
              <p>消除3张玫瑰牌 → 道具增强</p>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h3>连击系统</h3>
          <p>连续消除可获得<strong>连击加成</strong>，最高5倍分数！</p>
        </div>

        <div class="help-section">
          <h3>主题切换</h3>
          <p>点击右上角 ⚙ 按钮可切换不同主题风格</p>
        </div>
      </div>
    `;

    const closeBtn = this.container.querySelector('#close-help');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  }

  open(): void {
    this.isOpen = true;
    this.container.style.display = 'flex';
  }

  close(): void {
    this.isOpen = false;
    this.container.style.display = 'none';
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  getElement(): HTMLDivElement {
    return this.container;
  }
}
