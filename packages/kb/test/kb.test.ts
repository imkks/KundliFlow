import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { createKnowledgeBase } from '../src/store.js';

const ROOT_DIR = path.resolve(__dirname, '../../..');
const TOPICS_PATH = path.join(ROOT_DIR, 'packages/content/topics/topics.yaml');
const CONCEPTS_PATH = path.join(ROOT_DIR, 'packages/content/kb/concepts.yaml');
const NAKSHATRAS_PATH = path.join(ROOT_DIR, 'packages/content/kb/nakshatras.yaml');
const PRINCIPLES_PATH = path.join(ROOT_DIR, 'packages/content/kb/yogas_and_principles.yaml');
const MEDICAL_PATH = path.join(ROOT_DIR, 'packages/content/kb/medical_astrology.yaml');
const MUHURTA_PATH = path.join(ROOT_DIR, 'packages/content/kb/muhurta_principles.yaml');

describe('L3-M1: packages/kb Knowledge Base & Topic Maps', () => {
  it('ingests topics and concepts, matches questions to topics, and enforces reviewed=1 gate', () => {
    const kb = createKnowledgeBase(':memory:');
    try {
      const topicCount = kb.ingestTopicsFile(TOPICS_PATH);
      const conceptCount = kb.ingestConceptsFile(CONCEPTS_PATH);
      const nakCount = kb.ingestConceptsFile(NAKSHATRAS_PATH);
      const prinCount = kb.ingestConceptsFile(PRINCIPLES_PATH);
      const medCount = kb.ingestConceptsFile(MEDICAL_PATH);
      const muhCount = kb.ingestConceptsFile(MUHURTA_PATH);

      expect(topicCount).toBeGreaterThanOrEqual(10);
      expect(conceptCount).toBeGreaterThanOrEqual(5);
      expect(nakCount).toBe(27);
      expect(prinCount).toBeGreaterThanOrEqual(20);
      expect(medCount).toBeGreaterThanOrEqual(10);
      expect(muhCount).toBeGreaterThanOrEqual(5);

      // Ingest an unreviewed item and ensure it is NOT retrieved
      kb.ingestItems([
        {
          id: 'unreviewed.home',
          type: 'concept_note',
          text: 'Unreviewed 4th house draft note.',
          lang: 'en',
          houses: '4',
          reviewed: 0,
          version: '1.0.0',
        },
      ]);

      const homeTopic = kb.matchTopic('How is my home life likely to go this year?');
      expect(homeTopic.id).toBe('home_family');
      expect(homeTopic.houses).toContain(4);

      const careerTopic = kb.matchTopic('When will I get a promotion at work?');
      expect(careerTopic.id).toBe('career');

      const results = kb.searchKnowledge('4th house', { house: 4 }, 5);
      expect(results.some((r) => r.id === 'concept.house4')).toBe(true);
      expect(results.some((r) => r.id === 'unreviewed.home')).toBe(false);
    } finally {
      kb.close();
    }
  });
});
