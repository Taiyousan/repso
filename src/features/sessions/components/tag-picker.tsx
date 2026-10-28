import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { normalizeText } from '@/lib/text';
import { FONTS, useThemeColors } from '@/lib/theme';

import { addSessionTagByName, deleteTag, setSessionTag } from '../mutations';
import { useSessionTagIds, useTags } from '../queries';

/** Offered in the selector as long as no tag has their name. */
const SUGGESTED_TAGS = ['En forme', 'Fatigué', 'Mal dormi', 'Douleur', 'Salle bondée', 'Deload'];

type SessionTagsProps = {
  sessionId: number;
  selected: { id: number; name: string }[];
};

/** Tags of a session on its recap: tap one to remove it, the selector adds or manages them. */
export function SessionTags({ sessionId, selected }: SessionTagsProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {selected.map((tag) => (
        <Chip
          key={tag.id}
          label={`${tag.name}  ✕`}
          selected
          onPress={() => setSessionTag(sessionId, tag.id, false)}
        />
      ))}
      <Chip
        label="+ Ajouter"
        onPress={() => router.push({ pathname: '/session/tags/[id]', params: { id: sessionId } })}
      />
    </View>
  );
}

/** Search, toggle, create and delete tags for a session. */
export function TagSelector({ sessionId }: { sessionId: number }) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const tags = useTags();
  const selectedIds = useSessionTagIds(sessionId);
  const [query, setQuery] = useState('');

  const search = normalizeText(query);
  const matches = (name: string) => normalizeText(name).includes(search);
  const existing = new Set(tags.map((tag) => normalizeText(tag.name)));
  const visibleTags = tags.filter((tag) => matches(tag.name));
  const suggestions = SUGGESTED_TAGS.filter(
    (name) => !existing.has(normalizeText(name)) && matches(name),
  );
  const canCreate =
    search !== '' &&
    !existing.has(search) &&
    !suggestions.some((name) => normalizeText(name) === search);

  const create = (name: string) => {
    addSessionTagByName(sessionId, name);
    setQuery('');
  };

  const confirmDelete = (tag: { id: number; name: string }) => {
    Alert.alert(`Supprimer le tag « ${tag.name} » ?`, 'Il sera retiré de tous tes entraînements.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteTag(tag.id) },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: insets.bottom + 16 }}
      keyboardShouldPersistTaps="handled">
      <TextInput
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => {
          if (canCreate) create(query);
        }}
        autoFocus
        maxLength={30}
        returnKeyType="done"
        placeholder="Rechercher ou créer un tag"
        placeholderTextColor={colors.muted}
        style={{ fontFamily: FONTS.sans, borderWidth: 1.5 }}
        className="rounded-xl border-ink bg-surface px-4 py-3 text-base text-foreground"
      />

      {canCreate ? (
        <TagRow label={`Créer « ${query.trim()} »`} icon="add" onPress={() => create(query)} />
      ) : null}

      {visibleTags.length > 0 ? (
        <Section title="Mes tags">
          <View>
            {visibleTags.map((tag) => {
              const checked = selectedIds.has(tag.id);
              return (
                <TagRow
                  key={tag.id}
                  label={tag.name}
                  icon={checked ? 'checked' : 'unchecked'}
                  onPress={() => setSessionTag(sessionId, tag.id, !checked)}
                  trailing={
                    <IconButton
                      icon={{ ios: 'trash', android: 'delete' }}
                      label={`Supprimer le tag ${tag.name}`}
                      tone="danger"
                      onPress={() => confirmDelete(tag)}
                    />
                  }
                />
              );
            })}
          </View>
        </Section>
      ) : null}

      {suggestions.length > 0 ? (
        <Section title="Suggestions">
          <View>
            {suggestions.map((name) => (
              <TagRow key={name} label={name} icon="unchecked" onPress={() => create(name)} />
            ))}
          </View>
        </Section>
      ) : null}

      <Button label="OK" onPress={() => router.back()} />
    </ScrollView>
  );
}

const ROW_ICONS = {
  checked: { ios: 'checkmark.square.fill', android: 'check_box' },
  unchecked: { ios: 'square', android: 'check_box_outline_blank' },
  add: { ios: 'plus', android: 'add' },
} as const;

function TagRow({
  label,
  icon,
  onPress,
  trailing,
}: {
  label: string;
  icon: keyof typeof ROW_ICONS;
  onPress: () => void;
  trailing?: ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        onPress={onPress}
        accessibilityRole={icon === 'add' ? 'button' : 'checkbox'}
        accessibilityState={icon === 'add' ? undefined : { checked: icon === 'checked' }}
        className="flex-1 flex-row items-center gap-3 py-3 active:opacity-70">
        <Icon
          name={ROW_ICONS[icon]}
          color={icon === 'unchecked' ? colors.muted : colors.foreground}
        />
        <Text className="flex-1 text-base text-foreground">{label}</Text>
      </Pressable>
      {trailing}
    </View>
  );
}
