import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Card from '@/components/Card';
import ProFeatureBadge from '@/components/ProFeatureBadge';
import { SHIELD_SURFACE, SHIELD_THEME } from '@/constants/shield-theme';
import { MATH_DISCLAIMER } from '@/utils/product-content';
import type { LotCoachContext } from '@/utils/lot-coach-context';
import {
  LOT_COACH_DAILY_LIMIT,
  LOT_COACH_QUICK_PROMPTS,
  askLotCoach,
  isLotCoachConfigured,
  readLotCoachUsage,
  type LotCoachQuickPrompt,
} from '@/utils/lot-coach';
import { getRemainingLotCoachQuestions } from '@/utils/lot-coach-usage';

type LotCoachCardProps = {
  context: LotCoachContext;
  onTrack?: (detail: string) => void;
  onAnswered?: () => void;
  title?: string;
  detail?: string;
  placeholder?: string;
  quickPrompts?: LotCoachQuickPrompt[];
};

export default function LotCoachCard({
  context,
  onTrack,
  onAnswered,
  title = 'Ask AI',
  detail = 'Chips above are instant. Use AI only if the pitch is unusual.',
  placeholder = 'They just said...',
  quickPrompts = LOT_COACH_QUICK_PROMPTS,
}: LotCoachCardProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(LOT_COACH_DAILY_LIMIT);
  const configured = isLotCoachConfigured();

  useEffect(() => {
    void readLotCoachUsage().then((usage) => {
      setRemaining(getRemainingLotCoachQuestions(usage));
    });
  }, []);

  async function handleAsk(prompt?: string) {
    const nextQuestion = (prompt ?? question).trim();
    if (!nextQuestion) {
      Alert.alert('Lot Coach', 'Enter a question or tap a quick prompt.');
      return;
    }

    if (!configured) {
      Alert.alert(
        'Lot Coach not configured',
        typeof __DEV__ !== 'undefined' && __DEV__
          ? 'Add LOT_COACH_API_SECRET to .env.local for the deployed worker, set LOT_COACH_DEV_API_URL for a local wrangler dev server, or set LOT_COACH_USE_MOCK=true for offline UI testing.'
          : 'This build does not have a Lot Coach API URL yet. Add LOT_COACH_API_URL to your EAS production environment and redeploy the backend worker.'
      );
      return;
    }

    setBusy(true);
    setAnswer(null);

    try {
      const response = await askLotCoach(nextQuestion, context);
      setAnswer(response);
      setQuestion(nextQuestion);
      const usage = await readLotCoachUsage();
      setRemaining(getRemainingLotCoachQuestions(usage));
      onTrack?.(nextQuestion.slice(0, 120));
      onAnswered?.();
    } catch (error) {
      Alert.alert('Lot Coach', error instanceof Error ? error.message : 'Could not get a Lot Coach answer.');
    } finally {
      setBusy(false);
    }
  }

  async function copyAnswer() {
    if (!answer) return;
    await Clipboard.setStringAsync(answer);
    Alert.alert('Copied', 'Lot Coach response copied to your clipboard.');
  }

  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <ProFeatureBadge unlocked />
      </View>
      <Text style={styles.detail}>{detail}</Text>
      <Text style={styles.meta}>
        {configured
          ? `${remaining} of ${LOT_COACH_DAILY_LIMIT} questions left today`
          : 'Backend not configured in this build'}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptRow}>
        {quickPrompts.map((prompt) => (
          <TouchableOpacity
            key={prompt.id}
            style={styles.promptChip}
            activeOpacity={0.85}
            disabled={busy || remaining <= 0}
            onPress={() => void handleAsk(prompt.question)}
          >
            <Text style={styles.promptChipText}>{prompt.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TextInput
        value={question}
        onChangeText={setQuestion}
        placeholder={placeholder}
        placeholderTextColor={SHIELD_THEME.textMuted}
        style={styles.input}
        multiline
        editable={!busy}
      />

      <AppButton
        label={busy ? 'Thinking...' : 'Ask Lot Coach'}
        onPress={() => void handleAsk()}
        disabled={busy || remaining <= 0}
      />

      {busy ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={SHIELD_THEME.primary} />
          <Text style={styles.detail}>Preparing a short, copy-ready answer...</Text>
        </View>
      ) : null}

      {answer ? (
        <View style={styles.answerBox}>
          <Text style={styles.answerTitle}>Suggested response</Text>
          <ScrollView style={styles.answerScroll} nestedScrollEnabled>
            <Text style={styles.answerText} selectable>
              {answer}
            </Text>
          </ScrollView>
          <AppButton label="Copy response" variant="secondary" onPress={() => void copyAnswer()} />
        </View>
      ) : null}

      <Text style={styles.disclaimer}>{MATH_DISCLAIMER} Lot Coach is educational guidance, not legal or financial advice.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    color: SHIELD_THEME.text,
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  detail: {
    color: SHIELD_THEME.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    color: SHIELD_THEME.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  promptRow: {
    gap: 8,
    paddingVertical: 2,
  },
  promptChip: {
    ...SHIELD_SURFACE.inset,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  promptChipText: {
    color: SHIELD_THEME.text,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    ...SHIELD_SURFACE.inset,
    minHeight: 88,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: SHIELD_THEME.text,
    fontSize: 15,
    lineHeight: 21,
    textAlignVertical: 'top',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  answerBox: {
    ...SHIELD_SURFACE.inset,
    padding: 14,
    gap: 10,
  },
  answerScroll: {
    maxHeight: 320,
  },
  answerTitle: {
    color: SHIELD_THEME.text,
    fontSize: 15,
    fontWeight: '800',
  },
  answerText: {
    color: SHIELD_THEME.text,
    fontSize: 14,
    lineHeight: 21,
  },
  disclaimer: {
    color: SHIELD_THEME.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
