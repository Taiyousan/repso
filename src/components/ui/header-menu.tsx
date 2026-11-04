import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from './icon-button';
import { Text } from './text';

export type HeaderMenuItem = {
  label: string;
  onPress: () => void;
  /** Shown in red, after a separator. */
  destructive?: boolean;
};

/** ⋮ button opening the screen's rare actions (export, abandon…). */
export function HeaderMenu({ items }: { items: HeaderMenuItem[] }) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const regular = items.filter((item) => !item.destructive);
  const destructive = items.filter((item) => item.destructive);

  const select = (item: HeaderMenuItem) => {
    setOpen(false);
    item.onPress();
  };

  return (
    <>
      <IconButton
        icon={{ ios: 'ellipsis', android: 'more_vert' }}
        label="Plus d'actions"
        onPress={() => setOpen(true)}
      />
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          accessibilityLabel="Fermer le menu"
          style={{ flex: 1, backgroundColor: '#11111126' }}>
          <View
            style={{
              position: 'absolute',
              top: insets.top + 52,
              right: 12,
              minWidth: 220,
              // Floats above the screen: a soft shadow, not the bottom edge of a button.
              boxShadow: '0px 8px 24px rgba(28, 36, 52, 0.14)',
            }}
            className="rounded-2xl border border-outline bg-surface py-1.5">
            {regular.map((item) => (
              <MenuRow key={item.label} item={item} onSelect={select} />
            ))}
            {regular.length > 0 && destructive.length > 0 ? (
              <View className="my-1 h-px bg-border" />
            ) : null}
            {destructive.map((item) => (
              <MenuRow key={item.label} item={item} onSelect={select} />
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function MenuRow({
  item,
  onSelect,
}: {
  item: HeaderMenuItem;
  onSelect: (item: HeaderMenuItem) => void;
}) {
  return (
    <Pressable
      onPress={() => onSelect(item)}
      accessibilityRole="menuitem"
      className="px-4 py-3 active:bg-surface-muted">
      <Text
        className={`text-base font-semibold ${item.destructive ? 'text-danger' : 'text-foreground'}`}>
        {item.label}
      </Text>
    </Pressable>
  );
}
