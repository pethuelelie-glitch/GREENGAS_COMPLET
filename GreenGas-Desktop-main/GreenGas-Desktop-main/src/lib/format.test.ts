import { describe, expect, it } from 'vitest';
import { date, dateHeure, initiales, kg, kwh, m3, nombre, pourcentage, telephone } from './format';

const nbsp = (s: string) => s.replaceAll(String.fromCharCode(0xa0), ' ').replaceAll(String.fromCharCode(0x202f), ' ');

describe('formats français', () => {
  it('nombres, séparateurs et signe moins typographique', () => {
    expect(nbsp(nombre(1785))).toBe('1 785');
    expect(nombre(8.54, 2)).toBe('8,54');
    expect(nombre(-30, 1, true)).toBe('−30,0');
    expect(nombre(null)).toBe('—');
  });

  it('unités toujours affichées', () => {
    expect(nbsp(kg(34, 1))).toBe('34,0 kg');
    expect(nbsp(m3(22.4))).toBe('22,4 m³');
    expect(nbsp(kwh(38.08))).toBe('38,08 kWh');
    expect(nbsp(pourcentage(-30))).toBe('−30,0 %');
    expect(nbsp(pourcentage(2))).toBe('+2,0 %');
  });

  it('dates au format 12/09/2026 08:30', () => {
    expect(date('2026-09-12')).toBe('12/09/2026');
    expect(dateHeure('2026-09-12T08:30:00Z')).toBe('12/09/2026 08:30');
  });

  it('téléphone lisible', () => {
    expect(telephone('+2250701020304')).toBe('+225 07 01 02 03 04');
  });

  it('initiales de l’avatar', () => {
    expect(initiales('Aya Opératrice')).toBe('AO');
    expect(initiales("Yao N'Guessan")).toBe('YN');
    expect(initiales('  administrateur  ')).toBe('A');
    expect(initiales('')).toBe('?');
  });
});
