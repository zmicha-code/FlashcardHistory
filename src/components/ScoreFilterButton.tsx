import { QueueInteractionScore } from "@remnote/plugin-sdk";

interface ScoreFilterButtonProps {
    score: QueueInteractionScore;
    amount: number;
    image: string;
    isSelected: boolean;
    onToggle: () => void;
  }
  
  //
  export const scoreToLabel: Record<QueueInteractionScore, string> = {
    [QueueInteractionScore.TOO_EARLY]: "Too Early",
    [QueueInteractionScore.AGAIN]: "Again",
    [QueueInteractionScore.HARD]: "Hard",
    [QueueInteractionScore.GOOD]: "Good",
    [QueueInteractionScore.EASY]: "Easy",
  };

  export const ScoreFilterButton: React.FC<ScoreFilterButtonProps> = ({ score, amount, image, isSelected, onToggle }) => {
    return (
      <button
        className={`p-1 rounded-md ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
        onClick={onToggle}
        title={scoreToLabel[score]} // Tooltip for accessibility
      >
        <img src={image} className="w-6 h-6" />
        <span className="text-black">{amount}</span>
      </button>
    );
  };