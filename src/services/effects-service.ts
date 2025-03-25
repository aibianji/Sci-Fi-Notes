// 效果配置
export interface EffectsConfig {
  enableGlow: boolean
  glowColor: string
  glowIntensity: number
  enableParticles: boolean
  particleType: "stars" | "dots" | "lines"
  particleDensity: number
  enableAnimations: boolean
  animationSpeed: number
  enableSounds: boolean
  soundVolume: number
}

// 默认效果配置
export const defaultEffectsConfig: EffectsConfig = {
  enableGlow: true,
  glowColor: "#00b7c2",
  glowIntensity: 5,
  enableParticles: true,
  particleType: "stars",
  particleDensity: 30,
  enableAnimations: true,
  animationSpeed: 5,
  enableSounds: false,
  soundVolume: 50,
}

// 效果服务
class EffectsService {
  private config: EffectsConfig = { ...defaultEffectsConfig }
  private particleContainer: HTMLElement | null = null
  private particles: HTMLElement[] = []
  private animationFrame: number | null = null

  // 初始化效果
  initialize(container: HTMLElement): void {
    this.particleContainer = document.createElement("div")
    this.particleContainer.className = "particle-container"
    this.particleContainer.style.position = "absolute"
    this.particleContainer.style.top = "0"
    this.particleContainer.style.left = "0"
    this.particleContainer.style.width = "100%"
    this.particleContainer.style.height = "100%"
    this.particleContainer.style.pointerEvents = "none"
    this.particleContainer.style.zIndex = "-1"
    this.particleContainer.style.overflow = "hidden"

    container.appendChild(this.particleContainer)

    this.applyConfig(this.config)
  }

  // 应用配置
  applyConfig(config: EffectsConfig): void {
    this.config = { ...config }

    // 应用发光效果
    if (this.particleContainer) {
      if (this.config.enableGlow) {
        this.particleContainer.style.boxShadow = `0 0 ${this.config.glowIntensity * 2}px ${this.config.glowColor}`
      } else {
        this.particleContainer.style.boxShadow = "none"
      }
    }

    // 应用粒子效果
    if (this.config.enableParticles) {
      this.startParticles()
    } else {
      this.stopParticles()
    }

    // 应用动画效果
    if (this.config.enableAnimations) {
      document.documentElement.style.setProperty("--animation-speed", `${this.config.animationSpeed / 5}s`)
    }

    // 应用声音效果
    if (this.config.enableSounds) {
      // 设置音量
      const volume = this.config.soundVolume / 100
      // 这里可以设置音频元素的音量
    }
  }

  // 开始粒子效果
  private startParticles(): void {
    if (!this.particleContainer) return

    // 清除现有粒子
    this.stopParticles()

    // 创建新粒子
    const count = this.config.particleDensity

    for (let i = 0; i < count; i++) {
      const particle = document.createElement("div")
      particle.className = "particle"

      // 设置粒子样式
      particle.style.position = "absolute"
      particle.style.pointerEvents = "none"

      // 根据粒子类型设置样式
      switch (this.config.particleType) {
        case "stars":
          particle.style.width = "2px"
          particle.style.height = "2px"
          particle.style.backgroundColor = this.config.glowColor
          particle.style.borderRadius = "50%"
          break
        case "dots":
          particle.style.width = "3px"
          particle.style.height = "3px"
          particle.style.backgroundColor = this.config.glowColor
          particle.style.borderRadius = "50%"
          break
        case "lines":
          particle.style.width = "1px"
          particle.style.height = "10px"
          particle.style.backgroundColor = this.config.glowColor
          particle.style.transform = "rotate(45deg)"
          break
      }

      // 随机位置
      particle.style.left = `${Math.random() * 100}%`
      particle.style.top = `${Math.random() * 100}%`

      // 添加动画
      particle.style.animation = `particle-float ${5 + Math.random() * 10}s linear infinite`
      particle.style.opacity = `${Math.random() * 0.5 + 0.2}`

      this.particleContainer.appendChild(particle)
      this.particles.push(particle)
    }

    // 开始动画循环
    this.animateParticles()
  }

  // 停止粒子效果
  private stopParticles(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    // 移除所有粒子
    this.particles.forEach((particle) => {
      particle.remove()
    })

    this.particles = []
  }

  // 动画粒子
  private animateParticles(): void {
    const animate = () => {
      this.particles.forEach((particle) => {
        // 获取当前位置
        const top = Number.parseFloat(particle.style.top)

        // 移动粒子
        particle.style.top = `${(top + 0.05) % 100}%`
      })

      this.animationFrame = requestAnimationFrame(animate)
    }

    this.animationFrame = requestAnimationFrame(animate)
  }

  // 播放声音
  playSound(soundType: "click" | "hover" | "create" | "delete"): void {
    if (!this.config.enableSounds) return

    // 这里可以实现声音播放逻辑
    console.log(`Playing sound: ${soundType}`)
  }

  // 清理资源
  cleanup(): void {
    this.stopParticles()

    if (this.particleContainer) {
      this.particleContainer.remove()
      this.particleContainer = null
    }
  }
}

// 导出单例
export const effectsService = new EffectsService()

