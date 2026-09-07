declare module 'react-native-sound' {
  type SoundCallback = (error?: unknown) => void;
  type PlayCallback = (success: boolean) => void;

  export default class Sound {
    static setCategory(category: string): void;

    constructor(
      filename: string,
      basePath?: string,
      onError?: SoundCallback,
    );

    play(onEnd?: PlayCallback): void;
    stop(callback?: () => void): void;
    release(): void;
  }
}
