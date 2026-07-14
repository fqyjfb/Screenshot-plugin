interface TextItem {
    id: string;
    x: number;
    y: number;
    content: string;
    color: string;
    fontSize: number;
    isEditing: boolean;
}

interface AnnotationLayerProps {
    texts: TextItem[];
    onTextInput: (id: string, content: string) => void;
    onTextBlur: (id: string) => void;
}

export const AnnotationLayer = ({ texts, onTextInput, onTextBlur }: AnnotationLayerProps) => {
    if (!texts || texts.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none">
            {texts.map(text => (
                <div
                    key={text.id}
                    className="absolute"
                    style={{
                        left: text.x,
                        top: text.y,
                        color: text.color,
                        fontSize: text.fontSize,
                        fontFamily: 'sans-serif',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        pointerEvents: text.isEditing ? 'auto' : 'none',
                        whiteSpace: 'pre-wrap'
                    }}
                >
                    {text.isEditing ? (
                        <input
                            type="text"
                            value={text.content}
                            onChange={(e) => onTextInput(text.id, e.target.value)}
                            onBlur={() => onTextBlur(text.id)}
                            className="bg-transparent border-none outline-none p-0 min-w-[60px] text-white font-medium"
                            autoFocus
                            placeholder="输入文字..."
                        />
                    ) : (
                        <span className="font-medium">{text.content}</span>
                    )}
                </div>
            ))}
        </div>
    );
};
