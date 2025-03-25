import { ref } from 'vue';

// 粒子效果配置
export interface ParticleConfig {
  enabled: boolean;
  count: number;
  color: string;
  speed: number;
  size: number;
  opacity: number;
}

// 全息效果配置
export interface HologramConfig {
  enabled: boolean;
  scanlineOpacity: number;
  scanlineSpeed: number;
  glitchIntensity: number;
  glowColor: string;
  glowIntensity: number;
}

// 背景效果配置
export interface BackgroundConfig {
  type: 'none' | 'stars' | 'grid' | 'matrix' | 'custom';
  customImage: string;
  opacity: number;
  animationSpeed: number;
  color: string;
}

// 全局效果配置
export interface EffectsConfig {
  particles: ParticleConfig;
  hologram: HologramConfig;
  background: BackgroundConfig;
  enableBlur: boolean;
  enableGlow: boolean;
  enableReflections: boolean;
  enableSoundEffects: boolean;
}

// 默认配置
export const defaultEffectsConfig: EffectsConfig = {
  particles: {
    enabled: false,
    count: 50,
    color: '#00a8ff',
    speed: 1,
    size: 2,
    opacity: 0.5
  },
  hologram: {
    enabled: false,
    scanlineOpacity: 0.1,
    scanlineSpeed: 1,
    glitchIntensity: 0.2,
    glowColor: '#00a8ff',
    glowIntensity: 0.5
  },
  background: {
    type: 'none',
    customImage: '',
    opacity: 0.2,
    animationSpeed: 1,
    color: '#0a0a1a'
  },
  enableBlur: false,
  enableGlow: true,
  enableReflections: false,
  enableSoundEffects: false
};

// 当前配置
export const effectsConfig = ref<EffectsConfig>({ ...defaultEffectsConfig });

// 加载配置
export function loadEffectsConfig(): void {
  const savedConfig = localStorage.getItem('sci-fi-notes-effects');
  if (savedConfig) {
    try {
      const parsed = JSON.parse(savedConfig);
      effectsConfig.value = { ...defaultEffectsConfig, ...parsed };
    } catch (e) {
      console.error('Failed to parse effects config', e);
    }
  }
}

// 保存配置
export function saveEffectsConfig(): void {
  localStorage.setItem('sci-fi-notes-effects', JSON.stringify(effectsConfig.value));
}

// 应用粒子效果
export function applyParticleEffect(container: HTMLElement): () => void {
  if (!effectsConfig.value.particles.enabled) return () => {};
  
  const config = effectsConfig.value.particles;
  const canvas = document.createElement('canvas');
  canvas.className = 'absolute inset-0 pointer-events-none z-0';
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  
  // 创建粒子
  const particles: {x: number; y: number; size: number; speed: number; opacity: number}[] = [];
  for (let i = 0; i < config.count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * config.size + 1,
      speed: Math.random() * config.speed + 0.1,
      opacity: Math.random() * config.opacity + 0.1
    });
  }
  
  // 动画循环
  let animationId: number;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(particle => {
      ctx.fillStyle = `${config.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      particle.y -= particle.speed;
      
      if (particle.y < -10) {
        particle.y = canvas.height + 10;
        particle.x = Math.random() * canvas.width;
      }
    });
    
    animationId = requestAnimationFrame(animate);
  };
  
  animate();
  
  // 返回清理函数
  return () => {
    cancelAnimationFrame(animationId);
    container.removeChild(canvas);
  };
}

// 应用全息效果
export function applyHologramEffect(element: HTMLElement): () => void {
  if (!effectsConfig.value.hologram.enabled) return () => {};
  
  const config = effectsConfig.value.hologram;
  
  // 添加扫描线
  const scanlines = document.createElement('div');
  scanlines.className = 'absolute inset-0 pointer-events-none z-10 overflow-hidden';
  scanlines.style.background = `repeating-linear-gradient(
    0deg,
    rgba(0, 168, 255, ${config.scanlineOpacity}) 0px,
    transparent 1px,
    transparent 2px
  )`;
  scanlines.style.backgroundSize = `100% 3px`;
  scanlines.style.animation = `scanline ${3 / config.scanlineSpeed}s linear infinite`;
  element.appendChild(scanlines);
  
  // 添加故障效果
  const glitch = document.createElement('div');
  glitch.className = 'absolute inset-0 pointer-events-none z-20 opacity-0';
  glitch.style.background = 'rgba(0, 168, 255, 0.2)';
  glitch.style.animation = `glitch ${5 / config.glitchIntensity}s ease-in-out infinite`;
  element.appendChild(glitch);
  
  // 添加辉光效果
  if (config.glowIntensity > 0) {
    element.style.boxShadow = `0 0 10px ${config.glowIntensity * 10}px ${config.glowColor}`;
  }
  
  // 添加CSS动画
  const style = document.createElement('style');
  style.textContent = `
    @keyframes scanline {
      0% { transform: translateY(0); }
      100% { transform: translateY(100%); }
    }
    
    @keyframes glitch {
      0%, 90%, 100% { opacity: 0; transform: translate(0); }
      10%, 30%, 50%, 70% { opacity: ${config.glitchIntensity}; transform: translate(-2px, 2px); }
      20%, 40%, 60%, 80% { opacity: ${config.glitchIntensity}; transform: translate(2px, -2px); }
    }
  `;
  document.head.appendChild(style);
  
  // 返回清理函数
  return () => {
    element.removeChild(scanlines);
    element.removeChild(glitch);
    element.style.boxShadow = '';
    document.head.removeChild(style);
  };
}

// 应用背景效果
export function applyBackgroundEffect(container: HTMLElement): () => void {
  const config = effectsConfig.value.background;
  if (config.type === 'none') return () => {};
  
  let cleanup: () => void;
  
  switch (config.type) {
    case 'stars':
      cleanup = applyStarsBackground(container);
      break;
    case 'grid':
      cleanup = applyGridBackground(container);
      break;
    case 'matrix':
      cleanup = applyMatrixBackground(container);
      break;
    case 'custom':
      cleanup = applyCustomBackground(container);
      break;
    default:
      return () => {};
  }
  
  return cleanup;
}

// 星空背景
function applyStarsBackground(container: HTMLElement): () => void {
  const config = effectsConfig.value.background;
  const canvas = document.createElement('canvas');
  canvas.className = 'fixed inset-0 pointer-events-none';
  canvas.style.zIndex = '-1';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.opacity = config.opacity.toString();
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  
  // 创建星星
  const stars: {x: number; y: number; size: number; opacity: number}[] = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2
    });
  }
  
  // 动画循环
  let animationId: number;
  const animate = () => {
    ctx.fillStyle = config.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    stars.forEach(star => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      
      // 闪烁效果
      star.opacity += (Math.random() - 0.5) * 0.01;
      star.opacity = Math.max(0.2, Math.min(1, star.opacity));
    });
    
    animationId = requestAnimationFrame(animate);
  };
  
  animate();
  
  // 返回清理函数
  return () => {
    cancelAnimationFrame(animationId);
    document.body.removeChild(canvas);
  };
}

// 网格背景
function applyGridBackground(container: HTMLElement): () => void {
  const config = effectsConfig.value.background;
  const canvas = document.createElement('canvas');
  canvas.className = 'fixed inset-0 pointer-events-none';
  canvas.style.zIndex = '-1';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.opacity = config.opacity.toString();
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  
  // 动画循环
  let animationId: number;
  let offset = 0;
  
  const animate = () => {
    ctx.fillStyle = config.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格
    ctx.strokeStyle = 'rgba(0, 168, 255, 0.3)';
    ctx.lineWidth = 1;
    
    // 水平线
    const gridSize = 30;
    for (let y = offset % gridSize; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // 垂直线
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // 移动网格
    offset += 0.2 * config.animationSpeed;
    
    animationId = requestAnimationFrame(animate);
  };
  
  animate();
  
  // 返回清理函数
  return () => {
    cancelAnimationFrame(animationId);
    document.body.removeChild(canvas);
  };
}

// 矩阵背景
function applyMatrixBackground(container: HTMLElement): () => void {
  const config = effectsConfig.value.background;
  const canvas = document.createElement('canvas');
  canvas.className = 'fixed inset-0 pointer-events-none';
  canvas.style.zIndex = '-1';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.opacity = config.opacity.toString();
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  
  // 矩阵字符
  const chars = '01'.split('');
  const columns = Math.floor(canvas.width / 20);
  const drops: number[] = [];
  
  for (let i = 0; i < columns; i++) {
    drops[i] = Math.floor(Math.random() * -canvas.height);
  }
  
  // 动画循环
  let animationId: number;
  
  const animate = () => {
    ctx.fillStyle = `rgba(0, 0, 0, 0.05)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#0f0';
    ctx.font = '15px monospace';
    
    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(text, i * 20, drops[i] * 20);
      
      if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      
      drops[i]++;
    }
    
    animationId = requestAnimationFrame(animate);
  };
  
  animate();
  
  // 返回清理函数
  return () => {
    cancelAnimationFrame(animationId);
    document.body.removeChild(canvas);
  };
}

// 自定义背景
function applyCustomBackground(container: HTMLElement): () => void {
  const config = effectsConfig.value.background;
  if (!config.customImage) return () => {};
  
  const background = document.createElement('div');
  background.className = 'fixed inset-0 pointer-events-none bg-cover bg-center';
  background.style.zIndex = '-1';
  background.style.backgroundImage = `url(${config.customImage})`;
  background.style.opacity = config.opacity.toString();
  document.body.appendChild(background);
  
  // 返回清理函数
  return () => {
    document.body.removeChild(background);
  };
}

// 播放音效
export function playSoundEffect(type: 'click' | 'create' | 'delete' | 'notification'): void {
  if (!effectsConfig.value.enableSoundEffects) return;
  
  const sounds = {
    click: 'assets/sounds/click.mp3',
    create: 'assets/sounds/create.mp3',
    delete: 'assets/sounds/delete.mp3',
    notification: 'assets/sounds/notification.mp3'
  };
  
  const audio = new Audio(sounds[type]);
  audio.volume = 0.3;
  audio.play().catch(e => console.error('Failed to play sound:', e));
}

