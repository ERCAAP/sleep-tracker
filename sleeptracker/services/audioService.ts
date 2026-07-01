import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface AudioTrack {
  id: string;
  title: string;
  category: 'nature' | 'white_noise' | 'meditation' | 'binaural' | 'custom';
  fileName: string;
  duration: number; // in seconds
  description: string;
  thumbnail?: string;
  isPremium: boolean;
  downloadUrl?: string; // Firebase Storage URL
  localPath?: string; // Local file path if downloaded
}

export interface PlaybackSettings {
  volume: number; // 0-1
  fadeInDuration: number; // seconds
  fadeOutDuration: number; // seconds
  autoStop: boolean;
  autoStopTime: number; // minutes
  loopMode: 'none' | 'single' | 'all';
}

class AudioService {
  private static instance: AudioService;
  private currentSound: Audio.Sound | null = null;
  private currentTrack: AudioTrack | null = null;
  private isPlaying: boolean = false;
  private settings: PlaybackSettings = {
    volume: 0.7,
    fadeInDuration: 3,
    fadeOutDuration: 5,
    autoStop: false,
    autoStopTime: 60,
    loopMode: 'single',
  };

  // Built-in audio library
  private builtInTracks: AudioTrack[] = [
    // Nature Sounds
    {
      id: 'rain_heavy',
      title: 'Heavy Rain',
      category: 'nature',
      fileName: 'rain_heavy.mp3',
      duration: 3600, // 1 hour
      description: 'Soothing heavy rain sounds for deep sleep',
      isPremium: false,
    },
    {
      id: 'rain_light',
      title: 'Light Rain',
      category: 'nature',
      fileName: 'rain_light.mp3',
      duration: 3600,
      description: 'Gentle rain drops for relaxation',
      isPremium: false,
    },
    {
      id: 'ocean_waves',
      title: 'Ocean Waves',
      category: 'nature',
      fileName: 'ocean_waves.mp3',
      duration: 3600,
      description: 'Calming ocean waves on the shore',
      isPremium: false,
    },
    {
      id: 'forest_night',
      title: 'Forest Night',
      category: 'nature',
      fileName: 'forest_night.mp3',
      duration: 3600,
      description: 'Peaceful forest sounds with gentle wildlife',
      isPremium: true,
    },
    {
      id: 'thunderstorm',
      title: 'Thunderstorm',
      category: 'nature',
      fileName: 'thunderstorm.mp3',
      duration: 2400,
      description: 'Distant thunder with rain',
      isPremium: true,
    },
    
    // White Noise
    {
      id: 'white_noise_classic',
      title: 'Classic White Noise',
      category: 'white_noise',
      fileName: 'white_noise.mp3',
      duration: 3600,
      description: 'Pure white noise for blocking distractions',
      isPremium: false,
    },
    {
      id: 'pink_noise',
      title: 'Pink Noise',
      category: 'white_noise',
      fileName: 'pink_noise.mp3',
      duration: 3600,
      description: 'Pink noise for better sleep quality',
      isPremium: false,
    },
    {
      id: 'brown_noise',
      title: 'Brown Noise',
      category: 'white_noise',
      fileName: 'brown_noise.mp3',
      duration: 3600,
      description: 'Deep brown noise for relaxation',
      isPremium: true,
    },
    
    // Meditation & Guided Sleep
    {
      id: 'breathing_exercise',
      title: 'Breathing Exercise',
      category: 'meditation',
      fileName: 'breathing_guide.mp3',
      duration: 600, // 10 minutes
      description: 'Guided breathing for better sleep',
      isPremium: false,
    },
    {
      id: 'body_scan',
      title: 'Body Scan Meditation',
      category: 'meditation',
      fileName: 'body_scan.mp3',
      duration: 1200, // 20 minutes
      description: 'Progressive muscle relaxation',
      isPremium: true,
    },
    {
      id: 'sleep_story',
      title: 'Sleep Story: Peaceful Garden',
      category: 'meditation',
      fileName: 'sleep_story_garden.mp3',
      duration: 1800, // 30 minutes
      description: 'Relaxing bedtime story for adults',
      isPremium: true,
    },
    
    // Binaural Beats
    {
      id: 'delta_waves',
      title: 'Delta Waves (Deep Sleep)',
      category: 'binaural',
      fileName: 'delta_waves.mp3',
      duration: 3600,
      description: '0.5-4 Hz binaural beats for deep sleep',
      isPremium: true,
    },
    {
      id: 'theta_waves',
      title: 'Theta Waves (REM Sleep)',
      category: 'binaural',
      fileName: 'theta_waves.mp3',
      duration: 3600,
      description: '4-8 Hz binaural beats for REM sleep',
      isPremium: true,
    },
  ];

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Set audio mode for sleep sounds
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Load settings
      await this.loadSettings();
      
      console.log('Audio service initialized');
    } catch (error) {
      console.error('Failed to initialize audio service:', error);
    }
  }

  async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('audioSettings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load audio settings:', error);
    }
  }

  async updateSettings(newSettings: Partial<PlaybackSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await AsyncStorage.setItem('audioSettings', JSON.stringify(this.settings));
  }

  getSettings(): PlaybackSettings {
    return { ...this.settings };
  }

  getAllTracks(): AudioTrack[] {
    return [...this.builtInTracks];
  }

  getTracksByCategory(category: AudioTrack['category']): AudioTrack[] {
    return this.builtInTracks.filter(track => track.category === category);
  }

  async playTrack(trackId: string): Promise<boolean> {
    try {
      // Stop current track if playing
      await this.stop();

      const track = this.builtInTracks.find(t => t.id === trackId);
      if (!track) {
        throw new Error(`Track not found: ${trackId}`);
      }

      // Check if file exists locally, if not use bundled asset
      const audioUri = this.getAudioUri(track);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        {
          volume: 0, // Start with 0 for fade in
          isLooping: this.settings.loopMode === 'single',
          shouldPlay: true,
        }
      );

      this.currentSound = sound;
      this.currentTrack = track;
      this.isPlaying = true;

      // Fade in
      await this.fadeIn();

      // Set up auto-stop timer if enabled
      if (this.settings.autoStop) {
        setTimeout(() => {
          this.fadeOutAndStop();
        }, this.settings.autoStopTime * 60 * 1000);
      }

      // Set up playback status listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish && !status.isLooping) {
          this.handleTrackFinished();
        }
      });

      console.log(`Playing track: ${track.title}`);
      return true;
    } catch (error) {
      console.error('Failed to play track:', error);
      return false;
    }
  }

  private getAudioUri(track: AudioTrack): string {
    // Check for downloaded file first
    if (track.localPath) {
      return track.localPath;
    }
    
    // For now, return a placeholder URL
    // In production, these would be either bundled assets or Firebase Storage URLs
    const baseUrl = 'https://www.soundjay.com/misc/sounds-'
    
    switch (track.fileName) {
      case 'rain_heavy.mp3':
        return baseUrl + 'rain-01.mp3'; // Placeholder
      case 'rain_light.mp3':
        return baseUrl + 'rain-02.mp3'; // Placeholder
      case 'ocean_waves.mp3':
        return baseUrl + 'ocean-01.mp3'; // Placeholder
      case 'white_noise.mp3':
        return baseUrl + 'whitenoise-01.mp3'; // Placeholder
      case 'pink_noise.mp3':
        return baseUrl + 'pinknoise-01.mp3'; // Placeholder
      case 'breathing_guide.mp3':
        return baseUrl + 'meditation-01.mp3'; // Placeholder
      default:
        // Return a basic tone for testing
        return 'https://www.soundjay.com/misc/sounds-rain-01.mp3'; // Fallback
    }
  }

  async pause(): Promise<void> {
    if (this.currentSound && this.isPlaying) {
      await this.currentSound.pauseAsync();
      this.isPlaying = false;
    }
  }

  async resume(): Promise<void> {
    if (this.currentSound && !this.isPlaying) {
      await this.currentSound.playAsync();
      this.isPlaying = true;
    }
  }

  async stop(): Promise<void> {
    if (this.currentSound) {
      await this.currentSound.stopAsync();
      await this.currentSound.unloadAsync();
      this.currentSound = null;
      this.currentTrack = null;
      this.isPlaying = false;
    }
  }

  async fadeOutAndStop(): Promise<void> {
    if (this.currentSound && this.isPlaying) {
      await this.fadeOut();
      await this.stop();
    }
  }

  private async fadeIn(): Promise<void> {
    if (!this.currentSound) return;

    const steps = 20;
    const stepTime = (this.settings.fadeInDuration * 1000) / steps;
    const volumeStep = this.settings.volume / steps;

    for (let i = 0; i <= steps; i++) {
      await this.currentSound.setVolumeAsync(volumeStep * i);
      await new Promise(resolve => setTimeout(resolve, stepTime));
    }
  }

  private async fadeOut(): Promise<void> {
    if (!this.currentSound) return;

    const steps = 20;
    const stepTime = (this.settings.fadeOutDuration * 1000) / steps;
    const volumeStep = this.settings.volume / steps;

    for (let i = steps; i >= 0; i--) {
      await this.currentSound.setVolumeAsync(volumeStep * i);
      await new Promise(resolve => setTimeout(resolve, stepTime));
    }
  }

  private async handleTrackFinished(): Promise<void> {
    if (this.settings.loopMode === 'all') {
      // Play next track in category
      const currentCategory = this.currentTrack?.category;
      if (currentCategory) {
        const categoryTracks = this.getTracksByCategory(currentCategory);
        const currentIndex = categoryTracks.findIndex(t => t.id === this.currentTrack?.id);
        const nextIndex = (currentIndex + 1) % categoryTracks.length;
        await this.playTrack(categoryTracks[nextIndex].id);
      }
    } else {
      await this.stop();
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (this.currentSound) {
      await this.currentSound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
    }
    this.settings.volume = volume;
    await this.updateSettings({ volume });
  }

  getCurrentTrack(): AudioTrack | null {
    return this.currentTrack;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  // Download management for premium tracks
  async downloadTrack(track: AudioTrack): Promise<boolean> {
    try {
      if (!track.downloadUrl) {
        throw new Error('No download URL available');
      }

      const fileName = `${track.id}.mp3`;
      const localUri = `${FileSystem.documentDirectory}audio/${fileName}`;
      
      // Create directory if it doesn't exist
      await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}audio/`, { intermediates: true });

      // Download file
      const downloadResult = await FileSystem.downloadAsync(track.downloadUrl, localUri);
      
      if (downloadResult.status === 200) {
        // Update track with local path
        track.localPath = localUri;
        
        // Save to downloaded tracks list
        const downloaded = await this.getDownloadedTracks();
        downloaded.push(track.id);
        await AsyncStorage.setItem('downloadedTracks', JSON.stringify(downloaded));
        
        console.log(`Downloaded track: ${track.title}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to download track ${track.title}:`, error);
      return false;
    }
  }

  async getDownloadedTracks(): Promise<string[]> {
    try {
      const stored = await AsyncStorage.getItem('downloadedTracks');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get downloaded tracks:', error);
      return [];
    }
  }

  async deleteDownloadedTrack(trackId: string): Promise<boolean> {
    try {
      const track = this.builtInTracks.find(t => t.id === trackId);
      if (track && track.localPath) {
        await FileSystem.deleteAsync(track.localPath);
        track.localPath = undefined;
        
        // Remove from downloaded list
        const downloaded = await this.getDownloadedTracks();
        const filtered = downloaded.filter(id => id !== trackId);
        await AsyncStorage.setItem('downloadedTracks', JSON.stringify(filtered));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to delete track ${trackId}:`, error);
      return false;
    }
  }

  // Sleep timer integration
  async startSleepTimer(minutes: number): Promise<void> {
    setTimeout(() => {
      this.fadeOutAndStop();
    }, minutes * 60 * 1000);
    
    console.log(`Sleep timer set for ${minutes} minutes`);
  }

  // Smart alarm integration
  async playAlarmSound(volume: number = 0.3): Promise<void> {
    try {
      // Placeholder alarm sound URL - replace with bundled asset when available
      const alarmSoundUri = 'https://www.soundjay.com/misc/bell-ringing-05.wav';
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: alarmSoundUri },
        {
          volume,
          isLooping: true,
          shouldPlay: true,
        }
      );

      // Gradually increase volume
      for (let i = 0; i <= 20; i++) {
        await sound.setVolumeAsync((volume * i) / 20);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second intervals
      }
    } catch (error) {
      console.error('Failed to play alarm sound:', error);
    }
  }
}

export default AudioService; 