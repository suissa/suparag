import { PromptInputBox } from "./AIPromptBox";

interface ChatInputFactoryProps {
  onSend: (message: string, files?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInputFactory = ({ 
  onSend, 
  disabled = false,
  placeholder = "Ask a question about your documents..."
}: ChatInputFactoryProps) => {
  return (
    <div className="w-full">
      <PromptInputBox 
        onSend={onSend}
        isLoading={disabled}
        placeholder={placeholder}
      />
    </div>
  );
};
