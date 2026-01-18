export type VoiceProfile = {
  rate: number;
  pitch: number;
  volume: number;
};

export const VOICE_PROFILES: Record<string, VoiceProfile> = {
  Pip: {
    rate: 1.1,
    pitch: 1.4,
    volume: 0.9
  },
  "Master Thomas": {
    rate: 0.8,
    pitch: 0.7,
    volume: 0.75
  },
  Luna: {
    rate: 1.2,
    pitch: 1.6,
    volume: 0.8
  },
  default: {
    rate: 0.95,
    pitch: 1.0,
    volume: 0.85
  }
};

