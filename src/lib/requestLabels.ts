const LABELS: Record<string, string> = {
  meeting: 'Встреча',
  game_108: 'Игра «108»',
  question: 'Вопрос',
  anonymous_question: 'Анонимный вопрос',
  crisis_triage: 'Поддержка',
};

export function requestTypeLabelRu(type: string): string {
  return LABELS[type] ?? type;
}
