/**
 * Role: tests place naming: brand parodies (tag and name), unknown brands, generic names kept, deterministic deformation of proper nouns, public toponyms, offensive names, overrides.
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { BrandParodies } from './brand-parody.ts';
import { deformName } from './deform-name.ts';
import { foldText } from './name-text.ts';
import { namePlace, type NamingRules } from './name-place.ts';

const rules: NamingRules = {
  seed: 'test',
  brands: new BrandParodies({ Orange: 'Oronge', 'Orange Money': 'Oronge Monnaie', Shell: 'Shall', 'Société générale': 'Société généreuse', 'Mobile Money': 'Mobile Money' }),
  genericWords: new Set(['maquis', 'le', 'la', 'chez', 'boutique', 'coiffure', 'dame', 'mobile', 'money'].map(foldText)),
  offensiveWords: new Set(['connard']),
  overrides: new Map([
    ['osm:node/99', null],
    ['osm:node/98', 'Chez Tantie (renommé)'],
  ]),
};
const place = (id: string, category: string, tags: Record<string, string>) => ({ id: id as `osm:node/${number}`, placeCategory: category, tags });

describe('namePlace', () => {
  it('should parody brands found in the name or in the brand tag, accent and case insensitive', () => {
    expect(namePlace(place('osm:node/1', 'finance.mobile_money', { name: 'Orange Money Siporex' }), rules)).toMatchObject({ displayName: 'Oronge Monnaie Siporex', source: 'brand-parody' });
    expect(namePlace(place('osm:node/2', 'transport.fuel', { brand: 'Shell' }), rules)).toMatchObject({ displayName: 'Shall', source: 'brand-parody' });
    expect(namePlace(place('osm:node/3', 'finance.bank', { name: 'SOCIÉTÉ GÉNÉRALE Yopougon' }), rules).displayName).toBe('Société généreuse Yopougon');
  });

  it('should keep purely generic names and deform proper nouns deterministically', () => {
    expect(namePlace(place('osm:node/4', 'beauty.hairdresser', { name: 'Coiffure Dame' }), rules)).toMatchObject({ displayName: 'Coiffure Dame', source: 'generic' });
    const a = namePlace(place('osm:node/5', 'food.maquis', { name: 'Maquis Le Pigeon' }), rules);
    expect(a.source).toBe('deformed');
    expect(a.displayName?.startsWith('Maquis Le ')).toBe(true);
    expect(a.displayName).not.toBe('Maquis Le Pigeon');
    expect(namePlace(place('osm:node/5', 'food.maquis', { name: 'Maquis Le Pigeon' }), rules)).toEqual(a);
  });

  it('should keep real names of public places', () => {
    expect(namePlace(place('osm:node/6', 'worship.church', { name: 'Paroisse Saint Pierre' }), rules)).toMatchObject({ displayName: 'Paroisse Saint Pierre', source: 'toponym' });
    expect(namePlace(place('osm:node/7', 'transport.stop', { name: 'Gare de Siporex' }), rules).source).toBe('toponym');
  });

  it('should hide offensive names and apply overrides', () => {
    expect(namePlace(place('osm:node/8', 'food.maquis', { name: 'Maquis des Connards' }), rules)).toMatchObject({ displayName: null, source: 'hidden' });
    expect(namePlace(place('osm:node/99', 'food.maquis', { name: 'Maquis X' }), rules)).toMatchObject({ displayName: null, source: 'override' });
    expect(namePlace(place('osm:node/98', 'food.maquis', { name: 'Maquis X' }), rules).displayName).toBe('Chez Tantie (renommé)');
  });

  it('should strip control characters from displayed names', () => {
    expect(namePlace(place('osm:node/9', 'worship.church', { name: 'Église\u0007  Sainte\nMarie' }), rules).displayName).toBe('Église Sainte Marie');
  });
});

describe('BrandParodies.unknownBrands', () => {
  it('should list brand tag values missing from the table', () => {
    expect(rules.brands.unknownBrands('Orange;Nouvelle Marque')).toEqual(['Nouvelle Marque']);
    expect(rules.brands.unknownBrands(undefined)).toEqual([]);
  });
});

describe('deformName', () => {
  it('should change at least 2 letters of a proper noun and keep its first letter and case', () => {
    const { text } = deformName('Pigeon', 'seed', new Set());
    expect(text[0]).toBe('P');
    expect([...text].filter((c, k) => c !== 'Pigeon'[k]).length).toBe(2);
  });
});
