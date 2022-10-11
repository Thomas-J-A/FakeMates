import { forwardRef } from 'react';
import Picker from 'emoji-picker-react';

// Custom wrapper around library component to allow a ref
// which is used for detecting clicks outside picker
const EmojiPicker = forwardRef(({content, setFieldValue, setFieldTouched, setIsVisiblePicker }, ref) => {
  const addEmoji = (emoji) => {
    setFieldTouched('content', true);
    setFieldValue('content', `${content}${emoji.emoji}`);
    setIsVisiblePicker(false);
  };

  return (
    <div className="emojiPicker" ref={ref}>
      <Picker
        className="emojiPicker__picker"
        onEmojiClick={(emoji) => addEmoji(emoji)}
        autoFocusSearch={false}
        lazyLoadEmojis={true}
        previewConfig={{ showPreview: false }}
        suggestedEmojisMode="recent"
        width="100%"
      />
    </div>
  );
});

export default EmojiPicker;
