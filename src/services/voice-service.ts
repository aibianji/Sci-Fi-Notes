// 语音命令配置
export interface VoiceCommandConfig {
  enabled: boolean
  language: string
  commandPrefix: string
  commands: VoiceCommand[]
  sensitivity: number
  continuousListening: boolean
}

// 语音命令
export interface VoiceCommand {
  id: string
  phrase: string
  action: string
  enabled: boolean
}

// 默认语音命令配置
export const defaultVoiceCommandConfig: VoiceCommandConfig = {
  enabled: false,
  language: "zh-CN",
  commandPrefix: "便签",
  commands: [
    { id: "1", phrase: "创建新便签", action: "create", enabled: true },
    { id: "2", phrase: "删除便签", action: "delete", enabled: true },
    { id: "3", phrase: "保存便签", action: "save", enabled: true },
    { id: "4", phrase: "搜索便签", action: "search", enabled: true },
    { id: "5", phrase: "设置优先级高", action: "setPriorityHigh", enabled: true },
  ],
  sensitivity: 7,
  continuousListening: false,
}

// 语音服务
class VoiceService {
  private config: VoiceCommandConfig = { ...defaultVoiceCommandConfig }
  private recognition: any = null
  private isListening = false
  private commandCallbacks: Map<string, Function> = new Map()

  // 初始化语音识别
  initialize(): boolean {
    // 检查浏览器支持
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser")
      return false
    }

    // 创建语音识别实例
    this.recognition = new SpeechRecognition()
    this.recognition.continuous = this.config.continuousListening
    this.recognition.interimResults = false
    this.recognition.lang = this.config.language

    // 设置事件处理
    this.recognition.onresult = this.handleSpeechResult.bind(this)
    this.recognition.onerror = this.handleSpeechError.bind(this)
    this.recognition.onend = this.handleSpeechEnd.bind(this)

    return true
  }

  // 应用配置
  applyConfig(config: VoiceCommandConfig): void {
    this.config = { ...config }

    if (this.recognition) {
      this.recognition.continuous = this.config.continuousListening
      this.recognition.lang = this.config.language

      // 如果正在监听，重新启动以应用新配置
      if (this.isListening) {
        this.stopListening()
        this.startListening()
      }
    }
  }

  // 开始监听
  startListening(): boolean {
    if (!this.recognition || !this.config.enabled) {
      return false
    }

    try {
      this.recognition.start()
      this.isListening = true
      return true
    } catch (error) {
      console.error("Failed to start speech recognition:", error)
      return false
    }
  }

  // 停止监听
  stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop()
      } catch (error) {
        console.error("Failed to stop speech recognition:", error)
      }
      this.isListening = false
    }
  }

  // 注册命令回调
  registerCommand(action: string, callback: Function): void {
    this.commandCallbacks.set(action, callback)
  }

  // 取消注册命令回调
  unregisterCommand(action: string): void {
    this.commandCallbacks.delete(action)
  }

  // 处理语音结果
  private handleSpeechResult(event: any): void {
    const result = event.results[event.results.length - 1]
    const transcript = result[0].transcript.trim().toLowerCase()

    console.log("Speech recognized:", transcript)

    // 检查命令前缀
    const prefix = this.config.commandPrefix.toLowerCase()
    if (!transcript.startsWith(prefix)) {
      return
    }

    // 提取命令部分
    const commandText = transcript.substring(prefix.length).trim()

    // 查找匹配的命令
    for (const command of this.config.commands) {
      if (!command.enabled) continue

      const phrase = command.phrase.toLowerCase()
      if (commandText.includes(phrase)) {
        this.executeCommand(command.action, commandText)
        break
      }
    }
  }

  // 执行命令
  private executeCommand(action: string, transcript: string): void {
    const callback = this.commandCallbacks.get(action)
    if (callback) {
      callback(transcript)
    } else {
      console.warn(`No callback registered for action: ${action}`)
    }
  }

  // 处理语音错误
  private handleSpeechError(event: any): void {
    console.error("Speech recognition error:", event.error)
    this.isListening = false
  }

  // 处理语音结束
  private handleSpeechEnd(): void {
    this.isListening = false

    // 如果配置为连续监听，则重新启动
    if (this.config.continuousListening && this.config.enabled) {
      this.startListening()
    }
  }

  // 清理资源
  cleanup(): void {
    this.stopListening()
    this.commandCallbacks.clear()
  }
}

// 导出单例
export const voiceService = new VoiceService()

