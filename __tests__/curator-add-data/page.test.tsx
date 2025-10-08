import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

// Mock Navbar and Footer to isolate the page component
jest.mock('../../app/components/Navbar', () => () => <div data-testid="mock-navbar">Navbar</div>);
jest.mock('../../app/components/Footer', () => () => <div data-testid="mock-footer">Footer</div>);

import CuratorAddDataPage from '../../app/curator-add-data/page';

describe('CuratorAddDataPage', () => {
  test('renders main headings and form controls', () => {
    render(<CuratorAddDataPage />);
    expect(screen.getByText(/Tambahkan Informasi Penyakit Menular/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sumber Berita/i)).toBeInTheDocument();
  });

  test('ringkasan char counter updates', () => {
    render(<CuratorAddDataPage />);
    const textarea = screen.getByPlaceholderText(/Tulis ringkasan singkat/i);
    fireEvent.change(textarea, { target: { value: 'halo' } });
    expect(screen.getByText(/4\/2000/)).toBeInTheDocument();
  });

  test('sumber berita validation rejects invalid input', async () => {
    render(<CuratorAddDataPage />);
    const sumber = screen.getByLabelText(/Sumber Berita/i);
    fireEvent.change(sumber, { target: { value: 'not-a-url' } });

    // immediate validation should show an error message
    await waitFor(() => {
      expect(screen.getByText(/Masukkan sumber berita yang valid/i)).toBeInTheDocument();
    });
  });

  test('can add new jenis penyakit via modal', async () => {
    render(<CuratorAddDataPage />);
    // there are two "Tambah baru" buttons; first is for jenis
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    fireEvent.click(tambahButtons[0]);
    const input = screen.getByPlaceholderText(/Nama penyakit/i);
    fireEvent.change(input, { target: { value: 'PenyakitTest' } });
    fireEvent.click(screen.getByText(/Simpan/i));
    // new item should show in list
    await waitFor(() => expect(screen.getByText(/PenyakitTest/i)).toBeInTheDocument());
  });

  test('emoji kewaspadaan scale updates value', () => {
    render(<CuratorAddDataPage />);
    const btn5 = screen.getByTitle('5 dari 5');
    fireEvent.click(btn5);
    expect(screen.getByText(/5 \/ 5/)).toBeInTheDocument();
  });

  test('hovering emojis updates display and clicking animates', async () => {
    render(<CuratorAddDataPage />);
    const btn3 = screen.getByTitle('3 dari 5');
    // hover
    fireEvent.mouseEnter(btn3);
    expect(screen.getByText(/3 \/ 5/)).toBeInTheDocument();
    fireEvent.mouseLeave(btn3);
    // click to animate
    fireEvent.click(btn3);
    // clicked should set value
    expect(screen.getByText(/3 \/ 5/)).toBeInTheDocument();
  });

  test('preSubmit shows validation modal when required fields missing', async () => {
    render(<CuratorAddDataPage />);
    // ensure form is empty and click Terapkan (preSubmit)
    fireEvent.click(screen.getByText(/Terapkan/i));
    await waitFor(() => expect(screen.getByText(/Validasi Gagal/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Tutup/i));
  });

  test('reset form clears values', async () => {
    render(<CuratorAddDataPage />);
    // set some values
  const jenisSearch = screen.getByPlaceholderText('Cari atau pilih...');
    fireEvent.change(jenisSearch, { target: { value: 'Demam' } });
    await waitFor(() => expect(screen.getByText(/Demam Berdarah/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Demam Berdarah/i));

    const btnReset = screen.getByText(/Reset/i);
    fireEvent.click(btnReset);
  // after reset the selected item text should be cleared; wait for inputs to be empty
  await waitFor(() => expect((screen.getByLabelText(/Sumber Berita/i) as HTMLInputElement).value).toBe(''));
  // use explicit IDs/placeholders to avoid ambiguous matches
  await waitFor(() => expect((screen.getByPlaceholderText('Cari atau pilih...') as HTMLInputElement).value).toBe(''));
  await waitFor(() => expect((screen.getByPlaceholderText('Cari atau pilih lokasi...') as HTMLInputElement).value).toBe(''));
  });

  test('can add new lokasi via modal', async () => {
    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    // second button is for lokasi
    fireEvent.click(tambahButtons[1]);
    const input = screen.getByPlaceholderText(/Nama lokasi/i);
    fireEvent.change(input, { target: { value: 'KotaTest' } });
    fireEvent.click(screen.getByText(/Simpan/i));
    await waitFor(() => expect(screen.getByText(/KotaTest/i)).toBeInTheDocument());
  });

  test('submit success shows message and resets form', async () => {
    render(<CuratorAddDataPage />);
    // select existing jenis and lokasi
    const jenisSearch = screen.getByPlaceholderText('Cari atau pilih...');
    fireEvent.change(jenisSearch, { target: { value: 'Demam' } });
    await waitFor(() => expect(screen.getByText(/Demam Berdarah/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Demam Berdarah/i));

    const lokasiSearch = screen.getByPlaceholderText('Cari atau pilih lokasi...');
    fireEvent.change(lokasiSearch, { target: { value: 'Jakarta' } });
    await waitFor(() => expect(screen.getByText(/Jakarta/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Jakarta/i));

    // sumber valid
    fireEvent.change(screen.getByLabelText(/Sumber Berita/i), { target: { value: 'https://example.com/news' } });
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat.../i), { target: { value: 'Ringkasan contoh' } });

    fireEvent.click(screen.getByText(/Terapkan/i));
    // success message should appear
    await waitFor(() => expect(screen.getByText(/Data berhasil disimpan./i)).toBeInTheDocument());
  });

  test('keyboard Enter/Space on emoji sets value', () => {
    render(<CuratorAddDataPage />);
    const btn2 = screen.getByTitle('2 dari 5');
    fireEvent.keyDown(btn2, { key: 'Enter', code: 'Enter' });
    expect(screen.getByText(/2 \/ 5/)).toBeInTheDocument();
  });

  test('tanggal validation produces combined messages when invalid', async () => {
    render(<CuratorAddDataPage />);
    // choose valid jenis and lokasi so tanggal validation runs in isolation
    const jenisSearch = screen.getByPlaceholderText('Cari atau pilih...');
    fireEvent.change(jenisSearch, { target: { value: 'Demam' } });
    await waitFor(() => expect(screen.getByText(/Demam Berdarah/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Demam Berdarah/i));

    const lokasiSearch = screen.getByPlaceholderText('Cari atau pilih lokasi...');
    fireEvent.change(lokasiSearch, { target: { value: 'Jakarta' } });
    await waitFor(() => expect(screen.getByText(/Jakarta/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Jakarta/i));

    // invalid date parts
    const dd = screen.getByPlaceholderText('DD');
    const mm = screen.getByPlaceholderText('MM');
    const yyyy = screen.getByPlaceholderText('YYYY');
    fireEvent.change(dd, { target: { value: '99' } });
    fireEvent.change(mm, { target: { value: '13' } });
    fireEvent.change(yyyy, { target: { value: '1800' } });

    fireEvent.click(screen.getByText(/Terapkan/i));
    await waitFor(() => expect(screen.getByText(/Validasi Gagal/i)).toBeInTheDocument());
    // should mention hari/bulan/tahun invalid in the modal
    expect(screen.getByText(/Format hari tidak valid/i) || screen.getByText(/Tahun tidak valid/i)).toBeTruthy();
    fireEvent.click(screen.getByText(/Tutup/i));
  });

  test('empty add-new jenis/lokasi does not close modal', async () => {
    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    // jenis modal empty save
    fireEvent.click(tambahButtons[0]);
    const jenisInput = screen.getByPlaceholderText(/Nama penyakit/i);
    expect(jenisInput).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Simpan/i));
    // still present because empty save returns early
    expect(screen.getByPlaceholderText(/Nama penyakit/i)).toBeInTheDocument();
    // close it
    fireEvent.click(screen.getByText(/Batal/i));

    // lokasi modal empty save
    fireEvent.click(tambahButtons[1]);
    const lokasiInput = screen.getByPlaceholderText(/Nama lokasi/i);
    expect(lokasiInput).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Simpan/i));
    expect(screen.getByPlaceholderText(/Nama lokasi/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Batal/i));
  });

  test('handleApply catch branch shows form error when console.log throws', async () => {
    // make console.log throw to exercise catch
    const orig = console.log;
    console.log = jest.fn(() => { throw new Error('boom'); }) as any;
    render(<CuratorAddDataPage />);

    // fill required fields
    const jenisSearch = screen.getByPlaceholderText('Cari atau pilih...');
    fireEvent.change(jenisSearch, { target: { value: 'Demam' } });
    await waitFor(() => expect(screen.getByText(/Demam Berdarah/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Demam Berdarah/i));

    const lokasiSearch = screen.getByPlaceholderText('Cari atau pilih lokasi...');
    fireEvent.change(lokasiSearch, { target: { value: 'Jakarta' } });
    await waitFor(() => expect(screen.getByText(/Jakarta/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Jakarta/i));

    // valid source and ringkasan
    fireEvent.change(screen.getByLabelText(/Sumber Berita/i), { target: { value: 'https://example.com/news' } });
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat.../i), { target: { value: 'Ringkasan contoh' } });

    fireEvent.click(screen.getByText(/Terapkan/i));
    await waitFor(() => expect(screen.getByText(/Gagal mengirim data/i)).toBeInTheDocument());

    // restore console
    console.log = orig;
  });

  test('success message clears after timeout', async () => {
    jest.useFakeTimers();
    render(<CuratorAddDataPage />);

    const jenisSearch = screen.getByPlaceholderText('Cari atau pilih...');
    fireEvent.change(jenisSearch, { target: { value: 'Demam' } });
    await waitFor(() => expect(screen.getByText(/Demam Berdarah/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Demam Berdarah/i));

    const lokasiSearch = screen.getByPlaceholderText('Cari atau pilih lokasi...');
    fireEvent.change(lokasiSearch, { target: { value: 'Jakarta' } });
    await waitFor(() => expect(screen.getByText(/Jakarta/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Jakarta/i));

    fireEvent.change(screen.getByLabelText(/Sumber Berita/i), { target: { value: 'https://example.com/news' } });
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat.../i), { target: { value: 'Ringkasan contoh' } });

    fireEvent.click(screen.getByText(/Terapkan/i));
    // success should appear
    await waitFor(() => expect(screen.getByText(/Data berhasil disimpan./i)).toBeInTheDocument());

    // advance timers so successMessage clears
    act(() => { jest.advanceTimersByTime(4000); });
    await waitFor(() => expect(screen.queryByText(/Data berhasil disimpan./i)).not.toBeInTheDocument());
    jest.useRealTimers();
  });

  test('filtered lists show no result when search misses', async () => {
    render(<CuratorAddDataPage />);
    const jenisSearch = screen.getByPlaceholderText('Cari atau pilih...');
    fireEvent.change(jenisSearch, { target: { value: 'ZZZNoMatch' } });
    const resultsJenis = screen.getAllByText(/Tidak ada hasil/i);
    expect(resultsJenis.length).toBeGreaterThanOrEqual(1);

    const lokasiSearch = screen.getByPlaceholderText('Cari atau pilih lokasi...');
    fireEvent.change(lokasiSearch, { target: { value: 'ZZZNoMatch' } });
    const resultsLokasi = screen.getAllByText(/Tidak ada hasil/i);
    // expect at least one 'Tidak ada hasil' (could be one for each list)
    expect(resultsLokasi.length).toBeGreaterThanOrEqual(1);
  });

  test('clearing sumber input removes validation error', async () => {
    render(<CuratorAddDataPage />);
    const sumber = screen.getByLabelText(/Sumber Berita/i);
    fireEvent.change(sumber, { target: { value: 'not-a-url' } });
    await waitFor(() => expect(screen.getByText(/Masukkan sumber berita yang valid/i)).toBeInTheDocument());
    // clear it
    fireEvent.change(sumber, { target: { value: '' } });
    await waitFor(() => expect(screen.queryByText(/Masukkan sumber berita yang valid/i)).not.toBeInTheDocument());
  });

  test('invalid usia shows validation modal', async () => {
    render(<CuratorAddDataPage />);
    fireEvent.click(screen.getByText(/Terapkan/i));
    await waitFor(() => expect(screen.getByText(/Validasi Gagal/i)).toBeInTheDocument());
    // set usia to invalid and required fields to pass
    const jenisSearch = screen.getByPlaceholderText('Cari atau pilih...');
    fireEvent.change(jenisSearch, { target: { value: 'Demam' } });
    await waitFor(() => expect(screen.getByText(/Demam Berdarah/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Demam Berdarah/i));
    const lokasiSearch = screen.getByPlaceholderText('Cari atau pilih lokasi...');
    fireEvent.change(lokasiSearch, { target: { value: 'Jakarta' } });
    await waitFor(() => expect(screen.getByText(/Jakarta/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Jakarta/i));
    fireEvent.change(screen.getByLabelText(/Usia Penderita/i), { target: { value: '-5' } });
    fireEvent.click(screen.getByText(/Terapkan/i));
    await waitFor(() => expect(screen.getByText(/Validasi Gagal/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Tutup/i));
  });

  test('Space key on emoji sets value', () => {
    render(<CuratorAddDataPage />);
    const btn4 = screen.getByTitle('4 dari 5');
    fireEvent.keyDown(btn4, { key: ' ', code: 'Space' });
    expect(screen.getByText(/4 \/ 5/)).toBeInTheDocument();
  });

  test('field-level error element appears after preSubmit', async () => {
    render(<CuratorAddDataPage />);
    // submit empty form
    fireEvent.click(screen.getByText(/Terapkan/i));
    await waitFor(() => expect(screen.getByText(/Validasi Gagal/i)).toBeInTheDocument());
    // the errors should also be set on the fields
    expect(screen.getByText(/Jenis penyakit wajib diisi./i)).toBeInTheDocument();
    expect(screen.getByText(/Lokasi wajib diisi./i)).toBeInTheDocument();
  });

  test('can change jenis kelamin select', () => {
    render(<CuratorAddDataPage />);
    const select = screen.getByLabelText(/Jenis Kelamin/i) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'Perempuan' } });
    expect(select.value).toBe('Perempuan');
    fireEvent.change(select, { target: { value: 'Lainnya / Tidak diketahui' } });
    expect(select.value).toBe('Lainnya / Tidak diketahui');
  });

  test('exercise all kewaspadaan emoji interactions (hover/key/click)', async () => {
    render(<CuratorAddDataPage />);
    for (let n = 0; n <= 5; n++) {
      const btn = screen.getByTitle(`${n} dari 5`);
      // hover
      fireEvent.mouseEnter(btn);
      expect(screen.getByText(new RegExp(`${n} \/ 5`))).toBeInTheDocument();
      fireEvent.mouseLeave(btn);

      // keyboard Enter
      fireEvent.keyDown(btn, { key: 'Enter', code: 'Enter' });
      expect(screen.getByText(new RegExp(`${n} \/ 5`))).toBeInTheDocument();

      // keyboard Space
      fireEvent.keyDown(btn, { key: ' ', code: 'Space' });
      expect(screen.getByText(new RegExp(`${n} \/ 5`))).toBeInTheDocument();

      // click
      fireEvent.click(btn);
      // after click it should be set
      await waitFor(() => expect(screen.getByText(new RegExp(`${n} \/ 5`))).toBeInTheDocument());
      // aria-pressed true for this button
      expect(btn.getAttribute('aria-pressed')).toBe('true');
    }
  });
});
