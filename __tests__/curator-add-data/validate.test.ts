import { validateFormState } from '../../app/curator-add-data/page';

describe('validateFormState pure validator', () => {
  test('requires jenisPenyakit and lokasi', () => {
    const res = validateFormState({});
    expect(res.jenisPenyakit).toBe('Jenis penyakit wajib diisi.');
    expect(res.lokasi).toBe('Lokasi wajib diisi.');
  });

  test('validates invalid day/month/year combinations', () => {
    const res = validateFormState({ jenisPenyakit: 'A', lokasi: 'B', tanggal: { dd: '99', mm: '13', yyyy: '1800' } });
    expect(res.tanggal).toMatch(/hari/i);
    expect(res.tanggal).toMatch(/Bulan|bulan/i);
    expect(res.tanggal).toMatch(/Tahun|tahun/i);
  });

  test('accepts valid date parts', () => {
    const res = validateFormState({ jenisPenyakit: 'A', lokasi: 'B', tanggal: { dd: '12', mm: '11', yyyy: '2020' } });
    expect(res.tanggal).toBeUndefined();
  });

  test('rejects invalid sumberBerita', () => {
    const res = validateFormState({ jenisPenyakit: 'A', lokasi: 'B', sumberBerita: 'not-a-url' });
    expect(res.sumberBerita).toBeDefined();
  });

  test('accepts domain-like sumberBerita', () => {
    const res = validateFormState({ jenisPenyakit: 'A', lokasi: 'B', sumberBerita: 'bandung.kompas.com' });
    expect(res.sumberBerita).toBeUndefined();
  });

  test('rejects invalid usia', () => {
    const res = validateFormState({ jenisPenyakit: 'A', lokasi: 'B', usia: '-5' });
    expect(res.usia).toBeDefined();
  });

  test('accepts numeric usia', () => {
    const res = validateFormState({ jenisPenyakit: 'A', lokasi: 'B', usia: '35' });
    expect(res.usia).toBeUndefined();
  });
});
