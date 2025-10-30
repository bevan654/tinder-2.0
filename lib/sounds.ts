// Sound utility functions for notifications
class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private enabled: boolean = true

  constructor() {
    if (typeof window !== 'undefined') {
      // Create audio elements for different notification types
      this.sounds.set('match', this.createAudio('/sounds/match.mp3', 0.5))
      this.sounds.set('message', this.createAudio('/sounds/message.mp3', 0.3))
      this.sounds.set('swipe', this.createAudio('/sounds/swipe.mp3', 0.2))
    }
  }

  private createAudio(src: string, volume: number): HTMLAudioElement {
    const audio = new Audio()
    audio.volume = volume
    // Use data URLs as fallback if files don't exist
    // These are simple beep sounds
    if (src === '/sounds/match.mp3') {
      // Higher pitched celebration sound
      audio.src = this.generateTone(800, 0.3, 'sine')
    } else if (src === '/sounds/message.mp3') {
      // Gentle notification sound
      audio.src = this.generateTone(600, 0.15, 'sine')
    } else if (src === '/sounds/swipe.mp3') {
      // Quick swoosh sound
      audio.src = this.generateTone(400, 0.1, 'sine')
    }
    return audio
  }

  private generateTone(frequency: number, duration: number, type: OscillatorType): string {
    // Generate a simple tone using Web Audio API and convert to data URL
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = frequency
      oscillator.type = type

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration)

      // Return empty data URL as we'll play through Web Audio API
      return ''
    } catch {
      return ''
    }
  }

  play(soundType: 'match' | 'message' | 'swipe') {
    if (!this.enabled) {
      console.log('Sounds disabled')
      return
    }

    console.log(`🔊 Playing sound: ${soundType}`)

    try {
      // Use Web Audio API for more reliable sound playback
      this.playWebAudio(soundType)
    } catch (error) {
      console.error('Sound playback error:', error)
    }
  }

  private playWebAudio(soundType: 'match' | 'message' | 'swipe') {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Resume audio context if suspended (required by browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      let frequency = 600
      let duration = 0.15
      let volume = 0.2

      switch (soundType) {
        case 'match':
          frequency = 800
          duration = 0.3
          volume = 0.3
          oscillator.type = 'sine'
          // Play ascending notes for celebration
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
          oscillator.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 0.1)
          oscillator.frequency.linearRampToValueAtTime(1000, audioContext.currentTime + 0.2)
          break
        case 'message':
          frequency = 700
          duration = 0.2
          volume = 0.25
          oscillator.type = 'sine'
          // Double beep for message
          oscillator.frequency.setValueAtTime(700, audioContext.currentTime)
          oscillator.frequency.setValueAtTime(700, audioContext.currentTime + 0.1)
          break
        case 'swipe':
          frequency = 400
          duration = 0.1
          volume = 0.15
          oscillator.type = 'sine'
          break
      }

      if (soundType !== 'match' && soundType !== 'message') {
        oscillator.frequency.value = frequency
      }

      gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration)

      console.log(`✅ Sound played successfully: ${soundType}`)
    } catch (error) {
      console.error('Web Audio error:', error)
    }
  }

  enable() {
    this.enabled = true
  }

  disable() {
    this.enabled = false
  }

  toggle() {
    this.enabled = !this.enabled
    return this.enabled
  }

  isEnabled() {
    return this.enabled
  }
}

// Singleton instance
let soundManager: SoundManager | null = null

export function getSoundManager(): SoundManager {
  if (typeof window === 'undefined') {
    // Return a mock on server
    return {
      play: () => {},
      enable: () => {},
      disable: () => {},
      toggle: () => true,
      isEnabled: () => true,
    } as any
  }

  if (!soundManager) {
    soundManager = new SoundManager()
  }
  return soundManager
}

export function playSound(type: 'match' | 'message' | 'swipe') {
  getSoundManager().play(type)
}
