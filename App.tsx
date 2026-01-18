
import React, { useState, useEffect } from 'react';
import { Story, JournalState } from './types';
import { generateStoryContent, generateStoryImage, editImageWithPrompt, generateVeoVideo, generateSpeech } from './services/geminiService';
import { StoryPaper, LoreSeal, ParchmentScrap } from './components/JournalUI';

const INITIAL_STORIES: Story[] = [
  {
    id: '1',
    title: 'The Swallow Who Could Not Fly',
    characterName: 'Pip',
    setting: 'A humble thatched cottage eaves',
    initialSadStory: "Pip was a small swallow with a heavy heart and a broken wing. While his brothers took to the golden summer sky, Pip could only watch from the mud below. The shadows of the clouds raced across the ground, a cruel reminder of the freedom he would never know.",
    poetry: "Wings of silk and heart of gold,\nStories left to remain untold.\nBound by earth while brothers fly,\nWaiting for a friendly sky.",
    characterQuote: "Will I ever reach the golden clouds?",
    lore: "Legend says the first swallow was made from a sunbeam and summer soil.",
    characterLore: "Pip once found a silver thread from a cloud, hidden now beneath the old eaves.",
    voiceName: 'Kore',
    status: 'sad',
  },
  {
    id: '2',
    title: 'The Little Clockmaker\'s Silence',
    characterName: 'Master Thomas',
    setting: 'A dusty workshop in a quiet village',
    initialSadStory: "Every clock in the village ticked with the pulse of Master Thomas's hand. But his own heart beat for a song he could no longer hear. Since the Great Silence fell upon him, he carved wooden dolls that could not speak, and his workshop became a museum of frozen moments.",
    poetry: "Ticking time in every gear,\nEchoes of what he cannot hear.\nA silent song, a lonely hand,\nIn a quiet, dusty land.",
    characterQuote: "I hold the time, but mine has run dry.",
    lore: "Thomas's first clock didn't tell time; it told his mother when he missed her.",
    characterLore: "Before the silence, Thomas could hear the music of the stars through his copper gears.",
    voiceName: 'Puck', // Male Voice
    status: 'sad',
  },
  {
    id: '3',
    title: 'The Girl Who Chased the Moon',
    characterName: 'Luna',
    setting: 'A field of silver-tipped wheat',
    initialSadStory: "Luna reached for the moon every night, believing it was a pearl lost by the sea. But the higher she climbed, the colder the night became. One morning, the moon vanished behind a shroud of grey fog, leaving her lost in a forest where the paths led only to yesterday.",
    poetry: "Silver light and dreams of mist,\nSearching for the light she missed.\nA pearl of white above the wheat,\nCold and lonely, bittersweet.",
    characterQuote: "The sky is so empty without its pearl.",
    lore: "Elders whisper the moon is a sleeping dragon's egg, waiting for sky-warmth.",
    characterLore: "Luna was born during an eclipse, giving her the power to see paths only starlight can reveal.",
    voiceName: 'Kore',
    status: 'sad',
  }
];

const App: React.FC = () => {
  const [state, setState] = useState<JournalState>({
    currentPageIndex: 0,
    isBookOpen: false,
    stories: INITIAL_STORIES,
    isVeoEnabled: false,
    audioVolume: 0.3
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFlipping, setIsFlipping] = useState<'next' | 'prev' | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [actionInput, setActionInput] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [activeCharacterLore, setActiveCharacterLore] = useState<string | null>(null);

  useEffect(() => {
    const initImages = async () => {
      setIsLoading(true);
      setLoadingMessage("Winding the clocks of Once Upon A Time...");
      const updatedStories = [...state.stories];
      for (let i = 0; i < updatedStories.length; i++) {
       if (!updatedStories[i].currentImage) {
  try {
    updatedStories[i].currentImage = await generateStoryImage(updatedStories[i].initialSadStory);
  } catch (e) {
    console.warn("Image generation failed, using placeholder:", e);
    updatedStories[i].currentImage = 'https://via.placeholder.com/400x400.png?text=Story+Image';
  }
}

      }
      setState(prev => ({ ...prev, stories: updatedStories }));
      setIsLoading(false);
    };
    initImages();
  }, []);

  const handleRewriteFate = async () => {
    if (!actionInput.trim()) return;
    const currentStory = state.stories[state.currentPageIndex - 1];
    if (!currentStory) return;

    setIsLoading(true);
    setLoadingMessage(`A kind wish is being granted...`);

    try {
      const prompt = `Rewrite this story: "${currentStory.initialSadStory}". The reader helps by: "${actionInput}". Provide a heartwarming happy ending, a new joyful character quote, a 4-line happy poem, a new secret world lore hint, and an intimate character past secret about this happy turn.`;
    let result;
try {
  result = await generateStoryContent(prompt);
} catch (err) {
  console.warn("Story rewrite failed, using fallback:", err);
  result = {
    story: "A joyful ending unfolds...",
    quote: "Happiness finds its way.",
    poetry: "Sunlight warms the sleepy town,\nJoy returns without a frown.\nLaughter rings where shadows lay,\nHearts are bright, come what may.",
    lore: "A new secret blooms under the old oak.",
    characterLore: "The hero remembers the kindness that changed the world."
  };
}

const imagePrompt = `Classic watercolor update: ${actionInput}. Add soft golden light, blooming flowers, and a sense of magical healing.`;
let newImage;
try {
  newImage = await editImageWithPrompt(currentStory.currentImage!, imagePrompt);
} catch (e) {
  console.warn("Edit image failed, using original:", e);
  newImage = currentStory.currentImage!;
}


      const updatedStories = [...state.stories];
      updatedStories[state.currentPageIndex - 1] = {
        ...currentStory,
        happyEnding: result.story,
        characterQuote: result.quote,
        poetry: result.poetry,
        lore: result.lore,
        characterLore: result.characterLore,
        currentImage: newImage,
        status: 'happy'
      };

      setState(prev => ({ ...prev, stories: updatedStories }));
      setActionInput('');
   } finally {
  setIsLoading(false);
}
  };

  const handleAnimate = async () => {
    const currentStory = state.stories[state.currentPageIndex - 1];
    if (!currentStory || !currentStory.currentImage) return;

    setIsLoading(true);
    setLoadingMessage("Blowing the dust off the memories...");

    try {
      const videoUri = await generateVeoVideo(
        currentStory.currentImage, 
        currentStory.happyEnding || currentStory.initialSadStory
      );
      
      if (videoUri) {
        const updatedStories = [...state.stories];
        updatedStories[state.currentPageIndex - 1].currentVideo = videoUri;
        setState(prev => ({ ...prev, stories: updatedStories }));
      }
    } catch (e) {
      alert("The vision was too delicate to hold. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const speakAndShowLore = (story: Story) => {
    setActiveCharacterLore(story.characterLore || "The heart has its own secrets.");
    if (story.characterQuote) {
      generateSpeech(story.characterQuote, story.voiceName || 'Kore');
    }
  };

  const nextPage = () => {
    if (state.currentPageIndex < state.stories.length && !isFlipping) {
      setIsFlipping('next');
      setActiveCharacterLore(null);
      setTimeout(() => {
        setState(prev => ({ ...prev, currentPageIndex: prev.currentPageIndex + 1, isBookOpen: true }));
      }, 700);
      
      setTimeout(() => {
        setIsFlipping(null);
        setIsRevealing(true);
        setTimeout(() => setIsRevealing(false), 800);
      }, 1200);
    }
  };

  const prevPage = () => {
    if (state.currentPageIndex > 0 && !isFlipping) {
      setIsFlipping('prev');
      setActiveCharacterLore(null);
      setTimeout(() => {
        setState(prev => ({ ...prev, currentPageIndex: prev.currentPageIndex - 1 }));
      }, 700);
      
      setTimeout(() => {
        setIsFlipping(null);
        setIsRevealing(true);
        setTimeout(() => setIsRevealing(false), 800);
      }, 1200);
    }
  };

  const renderPage = (index: number) => {
    if (index === 0) {
      return (
        <div className={`flex items-center justify-center h-full transition-all ${isFlipping === 'next' ? 'flipping-right' : ''}`}>
           <div className="w-full max-w-2xl h-[80vh] book-cover rounded-md p-1 relative flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute inset-4 border border-[#c9b996] pointer-events-none" />
              <div className="absolute top-0 right-0 w-48 h-full opacity-10 pointer-events-none">
                <svg viewBox="0 0 100 400" className="w-full h-full fill-[#4a3728]">
                  <path d="M50,0 Q80,100 20,200 T50,400" fill="none" stroke="currentColor" />
                </svg>
              </div>
              
              <h1 className="story-font text-6xl text-[#4a3728] text-center mb-2 leading-tight">
                Once Upon<br/>A Story
              </h1>
              <div className="w-24 h-[1px] bg-[#c9b996] my-8" />
              <p className="script-font text-3xl text-[#7a8c6e] mb-12">The Book of Lost Whispers</p>
              
              <button 
                onClick={nextPage}
                className="px-12 py-3 bg-transparent border-2 border-[#c9b996] text-[#4a3728] hover:bg-[#c9b996]/10 transition-all font-bold story-font text-xl tracking-widest"
              >
                Begin the Tale
              </button>
              
              <div className="absolute bottom-8 text-xs opacity-40 uppercase tracking-[0.3em] story-font">
                Anno MCMXXV
              </div>
           </div>
        </div>
      );
    }

    const story = state.stories[index - 1];
    if (!story) return null;

    return (
      <div className={`grid grid-cols-1 lg:grid-cols-2 h-full shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] rounded-lg overflow-hidden bg-white ${isFlipping === 'next' ? 'flipping-right' : isFlipping === 'prev' ? 'flipping-left' : ''}`}>
        <div className={`flex flex-col h-full lg:contents ${isRevealing ? 'content-reveal' : ''}`}>
            {/* LEFT PAGE: STORY TEXT AND POETRY */}
            <StoryPaper className="border-r border-[#e2d9c2]">
              {story.lore && <LoreSeal text={story.lore} />}
              
              <div className="mb-4 text-center">
                <h2 className={`story-font text-3xl font-bold text-[#4a3728] italic ${story.status === 'happy' ? 'shimmer-text-happy' : ''}`}>
                  {story.title}
                </h2>
                <div className="w-12 h-[1px] bg-[#c9b996] mx-auto mt-2" />
              </div>
              
              <div className="flex flex-col gap-4 max-h-[65%] overflow-y-auto pr-4 scrollbar-ancient">
                <div className={`border-l-4 border-[#c9b996]/30 pl-4 py-2 italic script-font text-2xl text-[#7a8c6e] whitespace-pre-line leading-relaxed ${story.status === 'happy' ? 'shimmer-text-happy' : ''}`}>
                  {story.poetry}
                </div>

                <div className="body-font text-lg leading-relaxed text-[#4a3728]">
                  {story.status === 'sad' ? (
                    <p className="italic opacity-80 first-letter:text-5xl first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:story-font first-letter:not-italic">{story.initialSadStory}</p>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 p-2 rounded-sm magical-glow">
                        <p className="text-[#3c5138] first-letter:text-5xl first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:story-font shimmer-text-happy">{story.happyEnding}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto pt-6">
                  {story.status === 'sad' ? (
                    <div className="space-y-4">
                      <p className="script-font text-xl text-[#7a8c6e]">"If only someone could..."</p>
                      <div className="flex gap-4">
                        <input 
                          type="text" 
                          value={actionInput}
                          onChange={(e) => setActionInput(e.target.value)}
                          placeholder="How will you help?"
                          className="flex-1 px-4 py-1 border-b-2 border-[#e2d9c2] bg-transparent focus:outline-none story-font text-lg text-[#4a3728] placeholder:opacity-30"
                        />
                        <button 
                          onClick={handleRewriteFate}
                          className="bg-[#c9b996] text-white px-5 py-1 rounded hover:bg-[#b8a782] transition story-font tracking-widest text-base shadow-sm active:scale-95"
                        >
                          Change Fate
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="bg-[#f0f4ef] p-3 rounded border border-[#dce4db] text-center magical-glow">
                        <p className="story-font text-[#3c5138] text-lg font-bold italic shimmer-text-happy">A beautiful new chapter begins.</p>
                      </div>
                      <button 
                        onClick={handleAnimate}
                        className="w-full bg-white border-2 border-[#c9b996] text-[#4a3728] py-2 rounded hover:bg-[#fdfaf3] transition story-font font-bold uppercase tracking-[0.1em] text-sm shadow-sm active:scale-95"
                      >
                        Breathe Life Into This Vision
                      </button>
                    </div>
                  )}
              </div>
            </StoryPaper>

            {/* RIGHT PAGE: ILLUSTRATION AND SPEECH */}
            <StoryPaper className="bg-[#fdfaf3]/30 border-l-0 flex flex-col items-center">
                <div className={`relative w-full aspect-square max-w-lg bg-white p-4 watercolor-shadow border border-[#e2d9c2] group transform rotate-1 ${story.status === 'happy' ? 'magical-glow' : ''}`}>
                  
                  {activeCharacterLore && (
                    <ParchmentScrap text={activeCharacterLore} onClose={() => setActiveCharacterLore(null)} />
                  )}

                  {story.characterQuote && !isLoading && !story.currentVideo && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30">
                      <div 
                        className={`speech-cloud story-font text-sm italic text-center ${story.status === 'happy' ? 'magical-glow border-[#c9b996]' : ''}`}
                        onClick={() => speakAndShowLore(story)}
                      >
                        <span className={story.status === 'happy' ? 'shimmer-text-happy' : ''}>"{story.characterQuote}"</span>
                        <span className="block text-[7px] mt-1 opacity-40 font-bold uppercase tracking-widest">A Secret Whispers</span>
                      </div>
                    </div>
                  )}

                  {story.currentVideo ? (
                    <video 
                      src={story.currentVideo} 
                      controls 
                      autoPlay 
                      loop 
                      className="w-full h-full object-cover rounded-sm shadow-inner"
                    />
                  ) : (
                    <div className="relative h-full overflow-hidden bg-[#fdfaf3]">
                      <img 
                        src={story.currentImage || 'https://picsum.photos/id/20/600/600'} 
                        alt={story.title} 
                        className={`w-full h-full object-cover rounded-sm shadow-inner transition-all duration-1000 ${isLoading ? 'blur-sm grayscale opacity-50' : ''}`}
                      />
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 border-2 border-[#c9b996] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mt-auto flex justify-between w-full max-w-lg pb-4">
                  <button 
                    onClick={prevPage} 
                    disabled={isFlipping !== null}
                    className="story-font text-[#4a3728] hover:text-[#7a8c6e] font-bold text-base flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={nextPage} 
                    disabled={isFlipping !== null}
                    className="story-font text-[#4a3728] hover:text-[#7a8c6e] font-bold text-base flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                  >
                    Forward →
                  </button>
                </div>
            </StoryPaper>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 md:p-12 relative">
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-100/30 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-100/20 blur-[100px]" />
      </div>

      <div className={`book-container w-full max-w-7xl h-[85vh] transition-all duration-1000 transform ${state.isBookOpen ? 'scale-100' : 'scale-95'}`}>
         {renderPage(state.currentPageIndex)}
      </div>

      {state.isBookOpen && (
        <button 
          onClick={() => {
            setState(p => ({...p, isBookOpen: false, currentPageIndex: 0}));
            setActiveCharacterLore(null);
          }}
          className="fixed bottom-8 right-8 text-[#4a3728]/50 hover:text-[#4a3728] transition story-font text-lg border-b border-[#c9b996]/50"
        >
          Close the Book
        </button>
      )}

      {isLoading && (
        <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
           <div className="w-16 h-16 mb-4 relative">
              <div className="absolute inset-0 border-2 border-[#c9b996] rounded-full animate-ping" />
              <div className="absolute inset-0 border-4 border-[#c9b996] border-t-transparent rounded-full animate-spin" />
           </div>
           <h2 className="story-font text-2xl text-[#4a3728] animate-pulse">{loadingMessage}</h2>
        </div>
      )}
    </div>
  );
};

export default App;
