import AsyncStorage from '@react-native-async-storage/async-storage';
import { SleepSession, SleepSessionDB } from '../database/models';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'insight' | 'warning';
}

export interface SleepInsight {
  type: 'sleep_quality' | 'duration' | 'consistency' | 'environment' | 'general';
  message: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

/**
 * AI Chat Service for Sleep Tracker
 * Provides intelligent sleep coaching and personalized recommendations
 */
export class AIChatService {
  private static instance: AIChatService;
  private apiKey: string | null = null;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';
  
  private constructor() {
    this.loadAPIKey();
  }

  static getInstance(): AIChatService {
    if (!AIChatService.instance) {
      AIChatService.instance = new AIChatService();
    }
    return AIChatService.instance;
  }

  private async loadAPIKey(): Promise<void> {
    try {
      this.apiKey = await AsyncStorage.getItem('openai_api_key');
    } catch (error) {
      console.error('Failed to load API key:', error);
    }
  }

  async setAPIKey(key: string): Promise<void> {
    try {
      this.apiKey = key;
      await AsyncStorage.setItem('openai_api_key', key);
    } catch (error) {
      console.error('Failed to save API key:', error);
    }
  }

  /**
   * Get personalized sleep insights based on user's sleep data
   */
  async getSleepInsights(): Promise<SleepInsight[]> {
    try {
      const recentSessions = SleepSessionDB.getRecentSessions(7);
      const insights: SleepInsight[] = [];

      if (recentSessions.length === 0) {
        insights.push({
          type: 'general',
          message: 'Henüz uyku veriniz bulunmuyor. Uyku takibine başlayarak kişiselleştirilmiş öneriler alabilirsiniz.',
          severity: 'low',
          suggestion: 'Bu gece uyku takibini başlatmayı deneyin.'
        });
        return insights;
      }

      // Analyze sleep quality
      const avgQuality = recentSessions.reduce((sum, session) => sum + session.quality, 0) / recentSessions.length;
      if (avgQuality < 70) {
        insights.push({
          type: 'sleep_quality',
          message: `Son 7 günlük uyku kaliteniz ortalaması %${Math.round(avgQuality)}. Bu idealden düşük.`,
          severity: avgQuality < 50 ? 'high' : 'medium',
          suggestion: 'Uyku ortamınızı kontrol edin ve yatmadan önce ekran kullanımını azaltın.'
        });
      }

      // Analyze sleep duration
      const avgDuration = recentSessions.reduce((sum, session) => sum + session.duration, 0) / recentSessions.length;
      if (avgDuration < 420) { // Less than 7 hours
        insights.push({
          type: 'duration',
          message: `Ortalama uyku süreniz ${Math.floor(avgDuration / 60)}s ${avgDuration % 60}d. Bu önerilen 7-9 saatten az.`,
          severity: avgDuration < 360 ? 'high' : 'medium',
          suggestion: 'Yatma saatinizi 30 dakika erkene alın.'
        });
      }

      // Analyze consistency
      const bedtimes = recentSessions.map(session => new Date(session.startTime).getHours() * 60 + new Date(session.startTime).getMinutes());
      const bedtimeVariance = this.calculateVariance(bedtimes);
      if (bedtimeVariance > 60) { // More than 1 hour variance
        insights.push({
          type: 'consistency',
          message: 'Yatma saatleriniz düzensiz. Tutarlı bir uyku programı uyku kalitenizi artırabilir.',
          severity: 'medium',
          suggestion: 'Her gün aynı saatte yatmaya çalışın.'
        });
      }

      return insights;
    } catch (error) {
      console.error('Failed to generate sleep insights:', error);
      return [];
    }
  }

  /**
   * Process user message and get AI response
   */
  async processMessage(userMessage: string, conversationHistory: ChatMessage[] = []): Promise<string> {
    try {
      // If no API key, provide fallback responses
      if (!this.apiKey) {
        return this.getFallbackResponse(userMessage);
      }

      const recentSessions = SleepSessionDB.getRecentSessions(7);
      const sleepContext = this.generateSleepContext(recentSessions);

      const systemPrompt = `Sen yardımsever bir uyku asistanı ve sağlık danışmanısın. Kullanıcıya uyku kalitesini artırmak için kişiselleştirilmiş, bilimsel tabanlı öneriler veriyorsun. 

Kullanıcının son 7 günlük uyku verisi:
${sleepContext}

Kurallar:
- Türkçe yanıt ver
- Kısa ve net ol (maksimum 100 kelime)
- Pratik öneriler ver
- Motivasyonel ol
- Tıbbi tanı koyma, doktora yönlendir
- Samimi ve arkadaşça konuş`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-6).map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        })),
        { role: 'user', content: userMessage }
      ];

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Üzgünüm, şu anda size yardım edemiyorum.';

    } catch (error) {
      console.error('Failed to process message:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Generate quick response suggestions based on context
   */
  getQuickSuggestions(): string[] {
    const suggestions = [
      'Uyku kalitemi nasıl artırabilirim?',
      'Geç yatıyorum, ne yapmalıyım?',
      'Sabah yorgun uyanıyorum, neden?',
      'Gece sık sık uyanıyorum',
      'Uyku programı nasıl oluştururum?',
      'Uyku öncesi ne yapmalıyım?'
    ];

    // Return 3 random suggestions
    return suggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
  }

  /**
   * Fallback responses when API is not available
   */
  private getFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('kalite') || lowerMessage.includes('quality')) {
      return '🌙 Uyku kalitenizi artırmak için: Düzenli uyku saatleri, karanlık ve serin ortam, yatmadan 2 saat önce ekranlardan uzak durun. Bu basit adımlar büyük fark yaratır!';
    }

    if (lowerMessage.includes('uyan') || lowerMessage.includes('yorgun')) {
      return '😴 Yorgun uyanmanızın sebepleri: Yetersiz derin uyku, düzensiz uyku saatleri veya çok geç yatmak olabilir. 7-9 saat uyku hedefleyin ve aynı saatte uyanın.';
    }

    if (lowerMessage.includes('geç') || lowerMessage.includes('yat')) {
      return '🕙 Geç yatma sorunu için: Akşam ışığı azaltın, kafein tüketimini öğleden sonra kesin, yatmadan 1 saat önce rahatlatıcı aktiviteler yapın. Kademeli olarak erken yatmaya başlayın.';
    }

    if (lowerMessage.includes('program') || lowerMessage.includes('rutin')) {
      return '📅 İdeal uyku rutini: Aynı saatte yat-kalk, yatmadan 30dk önce ekranları kapat, 20dk okuma/meditasyon yap. Hafta sonları da bu rutini koruyun.';
    }

    // Default response
    return '🤗 Uyku asistanınız olarak size yardımcı olmaya hazırım! Uyku kalitenizi artırmak, daha iyi bir uyku rutini oluşturmak veya uyku sorunlarınız hakkında sorularınızı sorabilirsiniz.';
  }

  /**
   * Generate sleep context for AI
   */
  private generateSleepContext(sessions: SleepSession[]): string {
    if (sessions.length === 0) {
      return 'Henüz uyku verisi yok.';
    }

    const avgQuality = sessions.reduce((sum, s) => sum + s.quality, 0) / sessions.length;
    const avgDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;

    return `
- Ortalama uyku kalitesi: %${Math.round(avgQuality)}
- Ortalama uyku süresi: ${Math.floor(avgDuration / 60)}s ${avgDuration % 60}d
- Son 7 günde ${sessions.length} uyku kaydı
- En son uyku: ${sessions[0] ? new Date(sessions[0].startTime).toLocaleDateString('tr-TR') : 'N/A'}
    `.trim();
  }

  /**
   * Calculate variance for consistency analysis
   */
  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }
}

// Export singleton instance
export const aiChatService = AIChatService.getInstance(); 