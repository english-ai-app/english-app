import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Sound from 'react-native-sound';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  DictionaryDefinitionGroup,
  DictionaryDefinitionItem,
  DictionaryEntry,
  DictionaryExample,
  DictionaryPhrase,
  DictionarySense,
  DictionarySearchResult,
  searchDictionary,
  suggestDictionaryWords,
} from '../services/dictionaryService';

type DictionaryScreenProps = {
  onBack?: () => void;
};

type TabKey = 'definitions' | 'examples' | 'phrases' | 'images';

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'definitions', label: 'Định nghĩa' },
  { key: 'examples', label: 'Ví dụ' },
  { key: 'phrases', label: 'Cụm từ' },
  { key: 'images', label: 'Hình ảnh' },
];

const normalizeArray = <T,>(items?: T[] | null): T[] =>
  Array.isArray(items) ? items : [];

const stripDiacritics = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, match => (match === 'Đ' ? 'D' : 'd'));

const buildSuggestionList = (prefix: string, suggestions?: string[]): string[] => {
  const cleanedPrefix = prefix.trim();
  const uniqueSuggestions = Array.from(
    new Set((suggestions || []).map(item => item.trim()).filter(Boolean)),
  );

  return uniqueSuggestions.length ? uniqueSuggestions : [cleanedPrefix];
};

const suggestionSkeletonRows = [0, 1, 2, 3];
const resultSkeletonRows = [0, 1, 2];

const partOfSpeechLabels: Record<string, string> = {
  noun: 'danh từ',
  verb: 'động từ',
  adjective: 'tính từ',
  adverb: 'trạng từ',
  pronoun: 'đại từ',
  preposition: 'giới từ',
  conjunction: 'liên từ',
  interjection: 'thán từ',
  abbreviation: 'viết tắt',
};

const partOfSpeechLabel = (value?: string | null): string | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return partOfSpeechLabels[normalized] || value;
};

const exampleItemsFrom = (
  exampleItems?: DictionaryExample[] | null,
  examples?: string[] | null,
): DictionaryExample[] => {
  const items = normalizeArray(exampleItems);
  if (items.length) return items;
  return normalizeArray(examples).map(text => ({ text }));
};

type ExampleItem = {
  text: string;
  meaningVi?: string | null;
};

type ExampleGroup = {
  id: string;
  label: string;
  definition?: string | null;
  meaningVi?: string | null;
  examples: ExampleItem[];
};

const DictionaryScreen: React.FC<DictionaryScreenProps> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<DictionarySearchResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('definitions');
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [selectedSenseId, setSelectedSenseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef<Sound | null>(null);
  const suggestRequestRef = useRef(0);
  const skipNextSuggestRef = useRef(false);

  const entries = useMemo(
    () => normalizeArray(result?.entries),
    [result?.entries],
  );

  const activeEntry = useMemo<DictionaryEntry | null>(() => {
    if (!entries.length) return null;
    return (
      entries.find(entry => entry.entryId === activeEntryId) ?? entries[0]
    );
  }, [activeEntryId, entries]);
  const activeEntryMeaningVi = useMemo(() => {
    const groupMeaning = activeEntry?.definitionGroups
      ?.flatMap(group => normalizeArray(group.definitions))
      .find(item => item.meaningVi)?.meaningVi;
    if (groupMeaning) return groupMeaning;
    return activeEntry?.senses?.find(sense => sense.meaningVi)?.meaningVi ?? null;
  }, [activeEntry]);
  const activePartOfSpeech = partOfSpeechLabel(activeEntry?.partOfSpeech);

  const allPhrases = useMemo<DictionaryPhrase[]>(
    () => entries.flatMap(entry => normalizeArray(entry.phrases)),
    [entries],
  );

  const allRelatedWords = useMemo(
    () => Array.from(new Set(entries.flatMap(entry => entry.relatedWords || []))),
    [entries],
  );
  const suggestionSkeletonWidth = useMemo(
    () => Math.min(260, Math.max(48, query.trim().length * 12)),
    [query],
  );
  const shouldShowSuggestionBox =
    suggesting || (showSuggestions && suggestions.length > 0);

  useEffect(() => {
    Sound.setCategory('Playback');

    return () => {
      soundRef.current?.stop();
      soundRef.current?.release();
      soundRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!activeEntryId && entries.length) {
      setActiveEntryId(entries[0].entryId);
    }
  }, [activeEntryId, entries]);

  useEffect(() => {
    const prefix = query.trim();
    suggestRequestRef.current += 1;
    const requestId = suggestRequestRef.current;

    if (skipNextSuggestRef.current) {
      skipNextSuggestRef.current = false;
      setSuggesting(false);
      return;
    }

    if (prefix.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggesting(false);
      return;
    }

    setSuggesting(true);
    const timer = setTimeout(async () => {
      try {
        const data = await suggestDictionaryWords(prefix);
        if (requestId !== suggestRequestRef.current) return;
        setSuggestions(buildSuggestionList(prefix, data.suggestions));
        setShowSuggestions(true);
      } catch {
        if (requestId !== suggestRequestRef.current) return;
        setSuggestions(buildSuggestionList(prefix));
        setShowSuggestions(true);
      } finally {
        if (requestId === suggestRequestRef.current) {
          setSuggesting(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleQueryChange = (value: string) => {
    setQuery(stripDiacritics(value));
    setResult(null);
    setActiveEntryId(null);
    setSelectedSenseId(null);
    if (error) setError('');
  };

  const runSearch = async (nextWord?: string) => {
    const word = (nextWord ?? query).trim();
    if (!word) {
      setError('Nhập từ cần tra trước đã.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setFavorite(false);
      setSelectedSenseId(null);
      setShowSuggestions(false);
      setSuggestions([]);
      const data = await searchDictionary(word);
      setResult(data);
      setActiveEntryId(data.entries?.[0]?.entryId ?? null);
      setActiveTab('definitions');
    } catch (searchError) {
      setResult(null);
      setActiveEntryId(null);
      setError(
        searchError instanceof Error
          ? searchError.message
          : 'Không thể tra từ lúc này',
      );
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    const audioUrl = activeEntry?.audioUrl;
    if (!audioUrl) {
      Alert.alert('Chưa có âm thanh', 'Từ này chưa có audio phát âm.');
      return;
    }

    soundRef.current?.stop();
    soundRef.current?.release();
    soundRef.current = null;
    setPlaying(true);

    const sound = new Sound(audioUrl, undefined, soundError => {
      if (soundError) {
        setPlaying(false);
        Alert.alert('Lỗi âm thanh', 'Không phát được phát âm của từ này.');
        return;
      }

      soundRef.current = sound;
      sound.play(success => {
        sound.release();
        if (soundRef.current === sound) {
          soundRef.current = null;
        }
        setPlaying(false);

        if (!success) {
          Alert.alert('Lỗi âm thanh', 'Phát âm bị gián đoạn.');
        }
      });
    });
  };

  const renderEmptyState = (message: string) => (
    <View style={styles.emptyState}>
      <Icon name="search-outline" size={22} color="#7a94b8" />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  const renderExample = (
    example: DictionaryExample,
    index: number,
    keyPrefix: string,
  ) => (
    <View key={`${keyPrefix}-${index}-${example.text}`} style={styles.exampleLine}>
      <View style={styles.bullet} />
      <View style={styles.exampleContent}>
        <Text style={styles.exampleText}>{example.text}</Text>
        {example.meaningVi ? (
          <Text style={styles.exampleTranslation}>{example.meaningVi}</Text>
        ) : null}
      </View>
    </View>
  );

  const renderSearchSkeleton = () => (
    <View style={styles.resultSkeleton}>
      <View style={styles.resultSkeletonHeader}>
        <View>
          <View style={styles.resultSkeletonTitle} />
          <View style={styles.resultSkeletonSubtitle} />
        </View>
        <View style={styles.resultSkeletonCircle} />
      </View>
      <View style={styles.resultSkeletonTabs}>
        <View style={styles.resultSkeletonTab} />
        <View style={styles.resultSkeletonTab} />
        <View style={styles.resultSkeletonTabShort} />
      </View>
      {resultSkeletonRows.map(row => (
        <View key={row} style={styles.resultSkeletonCard}>
          <View style={styles.resultSkeletonLineWide} />
          <View style={styles.resultSkeletonLineMedium} />
          <View style={styles.resultSkeletonLineShort} />
        </View>
      ))}
    </View>
  );

  const renderSense = (sense: DictionarySense, index: number) => {
    const selected = selectedSenseId === sense.senseId;
    return (
      <TouchableOpacity
        key={sense.senseId || `${activeEntry?.entryId}-sense-${index}`}
        activeOpacity={0.86}
        onPress={() => setSelectedSenseId(sense.senseId)}
        style={[styles.senseCard, selected && styles.senseCardSelected]}
      >
        <View style={styles.senseHeader}>
          <Text style={styles.senseNumber}>
            {sense.senseNumber || `${index + 1}`}
          </Text>
          {sense.usageLabels?.length ? (
            <View style={styles.labelWrap}>
              {sense.usageLabels.map(label => (
                <Text key={label} style={styles.usageLabel}>
                  {label}
                </Text>
              ))}
            </View>
          ) : null}
          {selected ? (
            <Icon name="checkmark-circle" size={18} color="#0f8bff" />
          ) : null}
        </View>

        {sense.definition ? (
          <Text style={styles.definitionText}>
            {sense.definition}
          </Text>
        ) : null}

        {sense.meaningVi ? (
          <Text style={styles.translation}>{sense.meaningVi}</Text>
        ) : null}

        {exampleItemsFrom(sense.exampleItems, sense.examples)
          .slice(0, 2)
          .map((example, exampleIndex) =>
            renderExample(example, exampleIndex, sense.senseId || 'sense'),
          )}
      </TouchableOpacity>
    );
  };

  const renderDefinitionItem = (
    item: DictionaryDefinitionItem,
    index: number,
  ) => (
    <View
      key={item.itemId || `${activeEntry?.entryId}-definition-${index}`}
      style={[
        styles.definitionItemBlock,
        item.subDefinition && styles.subDefinitionBlock,
      ]}
    >
      {item.subDefinition ? <View style={styles.definitionBullet} /> : null}
      <View style={styles.definitionBody}>
        {item.usageLabels?.length ? (
          <View style={styles.labelWrap}>
            {item.usageLabels.map(label => (
              <Text key={label} style={styles.usageLabel}>
                {label}
              </Text>
            ))}
          </View>
        ) : null}

        <Text style={styles.definitionText}>{item.definition}</Text>

        {item.meaningVi ? (
          <Text style={styles.translation}>{item.meaningVi}</Text>
        ) : null}

        {exampleItemsFrom(item.exampleItems, item.examples)
          .slice(0, 2)
          .map((example, exampleIndex) =>
            renderExample(example, exampleIndex, item.itemId || 'definition'),
          )}
      </View>
    </View>
  );

  const renderDefinitionGroup = (
    group: DictionaryDefinitionGroup,
    index: number,
  ) => (
    <View
      key={group.groupId || `${activeEntry?.entryId}-definition-group-${index}`}
      style={styles.senseCard}
    >
      <Text style={styles.cardNumber}>Nghĩa {index + 1}</Text>
      {normalizeArray(group.definitions).map(renderDefinitionItem)}

      {group.seeAlso?.length ? (
        <View style={styles.seeAlsoBlock}>
          <Text style={styles.seeAlsoTitle}>Xem thêm</Text>
          <Text style={styles.seeAlsoText}>{group.seeAlso.join(' · ')}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderDefinitions = () => {
    const definitionGroups = normalizeArray(activeEntry?.definitionGroups);
    if (definitionGroups.length) {
      return (
        <View style={styles.stack}>
          {definitionGroups.map(renderDefinitionGroup)}
        </View>
      );
    }

    const senses = normalizeArray(activeEntry?.senses);
    if (!senses.length) {
      return renderEmptyState('Chưa có định nghĩa cho mục từ này.');
    }

    return <View style={styles.stack}>{senses.map(renderSense)}</View>;
  };

  const renderExamples = () => {
    const seen = new Set<string>();
    const definitionGroups = normalizeArray(activeEntry?.definitionGroups);
    const groupedExamples: ExampleGroup[] = definitionGroups.length
      ? definitionGroups
          .map((group, groupIndex): ExampleGroup => {
            const definitions = normalizeArray(group.definitions);
            const examples = definitions.flatMap(item =>
              exampleItemsFrom(item.exampleItems, item.examples).filter(example => {
                const key = example.text.trim().toLowerCase();
                if (!key || seen.has(key)) return false;
                seen.add(key);
                return true;
              }),
            );
            const mainDefinition = definitions[0];
            return {
              id: group.groupId || `definition-group-${groupIndex}`,
              label: `Nghĩa ${groupIndex + 1}`,
              definition: mainDefinition?.definition,
              meaningVi: mainDefinition?.meaningVi,
              examples,
            };
          })
          .filter(group => group.examples.length)
      : normalizeArray(activeEntry?.senses)
          .map((sense, senseIndex): ExampleGroup => {
            const examples = exampleItemsFrom(sense.exampleItems, sense.examples)
              .filter(example => {
                const key = example.text.trim().toLowerCase();
                if (!key || seen.has(key)) return false;
                seen.add(key);
                return true;
              });
            return {
              id: sense.senseId || `sense-${senseIndex}`,
              label: `Nghĩa ${senseIndex + 1}`,
              definition: sense.definition,
              meaningVi: sense.meaningVi,
              examples,
            };
          })
          .filter(group => group.examples.length);

    if (!groupedExamples.length) {
      return renderEmptyState('Chưa có ví dụ cho mục từ này.');
    }

    return (
      <View style={styles.stack}>
        {groupedExamples.map(group => (
          <View key={group.id} style={styles.exampleCard}>
            <Text style={styles.exampleTitle}>{group.label}</Text>
            {group.definition ? (
              <Text style={styles.exampleDefinition}>{group.definition}</Text>
            ) : null}
            {group.meaningVi ? (
              <Text style={styles.exampleDefinitionVi}>{group.meaningVi}</Text>
            ) : null}
            {group.examples.map((example, exampleIndex) =>
              renderExample(example, exampleIndex, group.id),
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderPhrases = () => {
    if (!allPhrases.length && !allRelatedWords.length) {
      return renderEmptyState('Chưa có cụm từ hoặc từ liên quan.');
    }

    return (
      <View style={styles.stack}>
        {allPhrases.map(phrase => (
          <View key={phrase.phraseId} style={styles.phraseCard}>
            <Text style={styles.phraseTitle}>{phrase.phrase}</Text>
            {phrase.usageLabels?.length ? (
              <Text style={styles.phraseLabel}>
                {phrase.usageLabels.join(', ')}
              </Text>
            ) : null}
            {phrase.definitions.slice(0, 2).map(definition => (
              <Text key={definition} style={styles.phraseDefinition}>
                {definition}
              </Text>
            ))}
            {phrase.examples.slice(0, 2).map(example => (
              <View key={example} style={styles.exampleLine}>
                <View style={styles.bullet} />
                <Text style={styles.exampleText}>{example}</Text>
              </View>
            ))}
          </View>
        ))}

        {allRelatedWords.length ? (
          <View style={styles.relatedBlock}>
            <Text style={styles.sectionTitle}>Từ liên quan</Text>
            <View style={styles.relatedWrap}>
              {allRelatedWords.map(word => (
                <TouchableOpacity
                  key={word}
                  activeOpacity={0.8}
                  style={styles.relatedChip}
                  onPress={() => {
                    setQuery(word);
                    runSearch(word);
                  }}
                >
                  <Text style={styles.relatedText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  const renderImages = () =>
    renderEmptyState('Merriam-Webster Learner API chưa trả dữ liệu hình ảnh.');

  const renderTabContent = () => {
    if (!activeEntry) {
      return null;
    }

    if (activeTab === 'definitions') return renderDefinitions();
    if (activeTab === 'examples') return renderExamples();
    if (activeTab === 'phrases') return renderPhrases();
    return renderImages();
  };

  const selectedSense = activeEntry?.senses?.find(
    sense => sense.senseId === selectedSenseId,
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onBack}
            style={styles.headerButton}
          >
            <Icon name="chevron-back" size={22} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Từ điển</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={styles.searchBox}>
            <Icon name="search-outline" size={18} color="#6b8ab6" />
            <TextInput
              value={query}
              onChangeText={handleQueryChange}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              placeholder="Nhập từ cần tra"
              placeholderTextColor="#95abc8"
              returnKeyType="search"
              onSubmitEditing={() => runSearch()}
              style={styles.searchInput}
            />
            {query ? (
              <TouchableOpacity
                disabled={loading}
                onPress={() => {
                  setQuery('');
                  setResult(null);
                  setError('');
                  setActiveEntryId(null);
                  setSelectedSenseId(null);
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
              >
                <Icon name="close-circle" size={18} color="#a6b6cc" />
              </TouchableOpacity>
            ) : null}
          </View>

          {shouldShowSuggestionBox ? (
            <View style={styles.suggestionBox}>
              {suggesting
                ? suggestionSkeletonRows.map(row => (
                    <View key={row} style={styles.suggestionSkeletonItem}>
                      <View
                        style={[
                          styles.suggestionSkeletonText,
                          { width: suggestionSkeletonWidth },
                        ]}
                      />
                    </View>
                  ))
                : suggestions.map(suggestion => (
                    <TouchableOpacity
                      key={suggestion}
                      activeOpacity={0.82}
                      style={styles.suggestionItem}
                      onPress={() => {
                        skipNextSuggestRef.current = true;
                        setQuery(suggestion);
                        runSearch(suggestion);
                      }}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
            </View>
          ) : null}

          {loading ? renderSearchSkeleton() : null}

          {error ? (
            <View style={styles.errorBox}>
              <Icon name="alert-circle-outline" size={18} color="#d14545" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {!result && !loading && !error ? (
            renderEmptyState('Nhập một từ tiếng Anh để tra nghĩa, ví dụ và phát âm.')
          ) : null}

          {result && !result.found ? (
            <View style={styles.notFoundBox}>
              <View style={styles.notFoundIconWrap}>
                <Icon name="document-text-outline" size={62} color="#8abbd5" />
                <View style={styles.notFoundSearchBadge}>
                  <Icon name="search-outline" size={25} color="#1e88c8" />
                </View>
                <Text style={styles.notFoundSparkLarge}>×</Text>
                <Text style={styles.notFoundSparkSmall}>×</Text>
              </View>
              <Text style={styles.notFoundTitle}>Không tìm thấy từ này</Text>
              {result.suggestions?.length ? (
                <>
                  <Text style={styles.notFoundText}>Có thể bạn muốn tìm:</Text>
                  <View style={[styles.relatedWrap, styles.notFoundSuggestionWrap]}>
                    {result.suggestions.map(suggestion => (
                      <TouchableOpacity
                        key={suggestion}
                        activeOpacity={0.8}
                        style={styles.relatedChip}
                        onPress={() => {
                          setQuery(suggestion);
                          runSearch(suggestion);
                        }}
                      >
                        <Text style={styles.relatedText}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <Text style={styles.notFoundText}>
                  Thử kiểm tra chính tả hoặc tra một dạng từ khác.
                </Text>
              )}
            </View>
          ) : null}

          {activeEntry ? (
            <>
              <View style={styles.wordHeader}>
                <View style={styles.wordTextWrap}>
                  <View style={styles.wordTitleRow}>
                    <Text style={styles.word}>{activeEntry.word}</Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={playing}
                      onPress={playAudio}
                      style={styles.soundButton}
                    >
                      <Icon
                        name={playing ? 'volume-medium' : 'volume-high'}
                        size={24}
                        color={activeEntry.audioUrl ? '#0f8bff' : '#9db1c9'}
                      />
                    </TouchableOpacity>
                  </View>
                  {activeEntryMeaningVi ? (
                    <Text style={styles.wordMeaningVi}>{activeEntryMeaningVi}</Text>
                  ) : null}
                  {activeEntry.ipa || activePartOfSpeech ? (
                    <Text style={styles.wordMeta}>
                      {[activeEntry.ipa ? `/${activeEntry.ipa}/` : null, activePartOfSpeech]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setFavorite(current => !current)}
                  style={styles.favoriteButton}
                >
                  <Icon
                    name={favorite ? 'heart' : 'heart-outline'}
                    size={25}
                    color={favorite ? '#ef4b6f' : '#5176ad'}
                  />
                </TouchableOpacity>
              </View>

              {entries.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.posRow}
                >
                  {entries.map(entry => {
                    const active = entry.entryId === activeEntry.entryId;
                    return (
                      <TouchableOpacity
                        key={entry.entryId}
                        activeOpacity={0.86}
                        onPress={() => {
                          setActiveEntryId(entry.entryId);
                          setSelectedSenseId(null);
                        }}
                        style={[styles.posChip, active && styles.posChipActive]}
                      >
                        <Text
                          style={[
                            styles.posChipText,
                            active && styles.posChipTextActive,
                          ]}
                        >
                          {entry.partOfSpeech || 'entry'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : null}

              {activeEntry.inflections?.length ? (
                <Text style={styles.inflections}>
                  Biến thể: {activeEntry.inflections.join(', ')}
                </Text>
              ) : null}

              <View style={styles.tabRow}>
                {tabs.map(tab => {
                  const active = activeTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      activeOpacity={0.85}
                      onPress={() => setActiveTab(tab.key)}
                      style={[styles.tabButton, active && styles.tabButtonActive]}
                    >
                      <Text
                        style={[styles.tabText, active && styles.tabTextActive]}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {renderTabContent()}

              <TouchableOpacity activeOpacity={0.88} style={styles.addButton}>
                <Icon name="add" size={21} color="#ffffff" />
                <Text style={styles.addButtonText}>
                  {selectedSense
                    ? 'Thêm nghĩa đã chọn'
                    : 'Thêm từ này'}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7fcff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f7fcff',
  },
  headerBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#1f2937',
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 28,
  },
  searchBox: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cfe3fb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#173b70',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0,
    marginLeft: 8,
  },
  suggestionBox: {
    backgroundColor: 'transparent',
    marginBottom: 12,
    paddingLeft: 16,
  },
  suggestionItem: {
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dfe3ec',
    paddingHorizontal: 0,
  },
  suggestionText: {
    flex: 1,
    color: '#2f3340',
    fontSize: 15,
    fontWeight: '500',
  },
  suggestionSkeletonItem: {
    minHeight: 64,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dfe3ec',
    paddingHorizontal: 12,
  },
  suggestionSkeletonText: {
    height: 13,
    borderRadius: 7,
    backgroundColor: '#dfe1e7',
  },
  resultSkeleton: {
    marginTop: 10,
    marginBottom: 16,
  },
  resultSkeletonHeader: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  resultSkeletonTitle: {
    width: 138,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dfe1e7',
    marginBottom: 10,
  },
  resultSkeletonSubtitle: {
    width: 86,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#e5e7ec',
  },
  resultSkeletonCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#e5e7ec',
  },
  resultSkeletonTabs: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    backgroundColor: '#eaf4ff',
    padding: 5,
    marginBottom: 14,
  },
  resultSkeletonTab: {
    flex: 1,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#dfe8f3',
  },
  resultSkeletonTabShort: {
    flex: 0.8,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#dfe8f3',
  },
  resultSkeletonCard: {
    borderWidth: 1,
    borderColor: '#d2e7ff',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 10,
  },
  resultSkeletonLineWide: {
    width: '82%',
    height: 14,
    borderRadius: 7,
    backgroundColor: '#dfe1e7',
    marginBottom: 11,
  },
  resultSkeletonLineMedium: {
    width: '64%',
    height: 13,
    borderRadius: 7,
    backgroundColor: '#e5e7ec',
    marginBottom: 10,
  },
  resultSkeletonLineShort: {
    width: '42%',
    height: 13,
    borderRadius: 7,
    backgroundColor: '#e5e7ec',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#ffd1d1',
    borderRadius: 8,
    backgroundColor: '#fff4f4',
    padding: 11,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    color: '#b83232',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginLeft: 8,
  },
  wordHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  wordTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  wordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  word: {
    color: '#172554',
    fontSize: 25,
    fontWeight: '900',
    marginRight: 9,
  },
  soundButton: {
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  phonetic: {
    color: '#49648a',
    fontSize: 15,
    fontWeight: '400',
    marginTop: 2,
  },
  wordMeaningVi: {
    color: '#173b70',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 21,
    marginTop: 2,
  },
  wordMeta: {
    color: '#49648a',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 2,
    marginBottom: 8,
  },
  wordType: {
    color: '#0f63ff',
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
    marginBottom: 10,
  },
  posRow: {
    paddingVertical: 8,
    gap: 8,
  },
  posChip: {
    minHeight: 32,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cfe3fb',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
  },
  posChipActive: {
    borderColor: '#0f8bff',
    backgroundColor: '#eaf6ff',
  },
  posChipText: {
    color: '#49648a',
    fontSize: 13,
    fontWeight: '500',
  },
  posChipTextActive: {
    color: '#0f63ff',
  },
  inflections: {
    color: '#5e789e',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 8,
  },
  translation: {
    color: '#173b70',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#eaf4ff',
    padding: 3,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: 2,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  tabText: {
    color: '#466080',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#0f63ff',
  },
  stack: {
    gap: 10,
    marginBottom: 16,
  },
  senseCard: {
    borderWidth: 1,
    borderColor: '#d2e7ff',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  senseCardSelected: {
    borderColor: '#0f8bff',
    backgroundColor: '#eef7ff',
  },
  cardNumber: {
    color: '#0f63ff',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 9,
  },
  senseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  senseNumber: {
    color: '#0f63ff',
    fontSize: 13,
    fontWeight: '900',
    marginRight: 8,
  },
  labelWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  usageLabel: {
    color: '#527093',
    fontSize: 11,
    fontWeight: '800',
    borderRadius: 6,
    backgroundColor: '#eaf4ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  definitionItemBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subDefinitionBlock: {
    marginTop: 3,
  },
  definitionBody: {
    flex: 1,
    minWidth: 0,
  },
  definitionBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#0f8bff',
    marginTop: 8,
    marginRight: 8,
  },
  definitionText: {
    color: '#173b70',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 7,
  },
  seeAlsoBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d8e9fb',
    paddingTop: 10,
    marginTop: 2,
  },
  seeAlsoTitle: {
    color: '#527093',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 5,
  },
  seeAlsoText: {
    color: '#0f63ff',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
  exampleCard: {
    borderWidth: 1,
    borderColor: '#d2e7ff',
    borderRadius: 10,
    backgroundColor: '#eef7ff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  exampleTitle: {
    color: '#173b70',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
  },
  exampleDefinition: {
    color: '#173b70',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginBottom: 4,
  },
  exampleDefinitionVi: {
    color: '#49648a',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
    marginBottom: 8,
  },
  exampleLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 5,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#0f8bff',
    marginTop: 7,
    marginRight: 7,
  },
  exampleContent: {
    flex: 1,
    minWidth: 0,
  },
  exampleText: {
    flex: 1,
    color: '#173b70',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  exampleTranslation: {
    color: '#49648a',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 2,
  },
  phraseCard: {
    borderWidth: 1,
    borderColor: '#d2e7ff',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  phraseTitle: {
    color: '#173b70',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 5,
  },
  phraseLabel: {
    color: '#5e789e',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 5,
  },
  phraseDefinition: {
    color: '#173b70',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginBottom: 4,
  },
  relatedBlock: {
    marginTop: 2,
  },
  sectionTitle: {
    color: '#173b70',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 9,
  },
  relatedWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relatedChip: {
    borderRadius: 16,
    backgroundColor: '#eaf6ff',
    borderWidth: 1,
    borderColor: '#cfe3fb',
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  relatedText: {
    color: '#0f63ff',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d2e7ff',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 22,
    marginBottom: 16,
  },
  emptyText: {
    color: '#5e789e',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 7,
  },
  notFoundBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingTop: 76,
    paddingBottom: 26,
    marginBottom: 16,
  },
  notFoundIconWrap: {
    width: 100,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  notFoundSearchBadge: {
    position: 'absolute',
    right: 13,
    bottom: 17,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7fcff',
  },
  notFoundSparkLarge: {
    position: 'absolute',
    right: 11,
    top: 1,
    color: '#1e88c8',
    fontSize: 18,
    fontWeight: '800',
  },
  notFoundSparkSmall: {
    position: 'absolute',
    left: 7,
    bottom: 24,
    color: '#9cc6d9',
    fontSize: 15,
    fontWeight: '800',
  },
  notFoundTitle: {
    color: '#173b70',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  notFoundText: {
    color: '#5e789e',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  notFoundSuggestionWrap: {
    justifyContent: 'center',
  },
  addButton: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0f8bff',
    marginTop: 2,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 5,
  },
});

export default DictionaryScreen;
