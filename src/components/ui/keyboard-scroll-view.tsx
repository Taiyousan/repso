import type { ComponentProps, Ref } from 'react';
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';
import type Animated from 'react-native-reanimated';
import type { AnimatedRef } from 'react-native-reanimated';

/** Room left between the focused field and the keyboard. */
const KEYBOARD_GAP = 24;

type KeyboardScrollViewProps = ComponentProps<typeof KeyboardAwareScrollView> & {
  /** Reanimated ref of the inner ScrollView, e.g. for a SortableList to scroll while dragging. */
  scrollRef?: AnimatedRef<Animated.ScrollView>;
};

/**
 * ScrollView of a screen with fields: scrolls the focused one above the keyboard. Android draws
 * edge-to-edge, so the window no longer shrinks for the keyboard. Takes styles, not class names.
 */
export function KeyboardScrollView({ scrollRef, ...props }: KeyboardScrollViewProps) {
  return (
    <KeyboardAwareScrollView
      bottomOffset={KEYBOARD_GAP}
      keyboardShouldPersistTaps="handled"
      {...props}
      // The inner view is a Reanimated ScrollView: an animated ref attaches to it as is.
      ref={scrollRef as unknown as Ref<KeyboardAwareScrollViewRef>}
    />
  );
}
