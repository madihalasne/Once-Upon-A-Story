
export interface Story {
  id: string;
  title: string;
  initialSadStory: string;
  poetry?: string;
  characterQuote?: string;
  happyEnding?: string;
  lore?: string;
  characterLore?: string;
  voiceName?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  currentImage?: string;
  currentVideo?: string;
  status: 'sad' | 'changing' | 'happy';
  characterName: string;
  setting: string;
}

export interface JournalState {
  currentPageIndex: number;
  isBookOpen: boolean;
  stories: Story[];
  isVeoEnabled: boolean;
  audioVolume: number;
}

export enum PageType {
  Cover = 'cover',
  Story = 'story',
  Interaction = 'interaction',
  End = 'end'
}
