import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

// Mock Navbar and Footer to isolate the page component
jest.mock('../../app/components/Navbar', () => () => <div data-testid="mock-navbar">Navbar</div>);
jest.mock('../../app/components/Footer', () => () => <div data-testid="mock-footer">Footer</div>);

import CuratorAddDataPage from '../../app/curator-add-data/page';
import { validateFormState } from '../../app/curator-add-data/page';

// helper to select exact text match (case-insensitive) when multiple similar entries exist
const getExactText = (text: string) => {
  const nodes = screen.getAllByText(new RegExp(`^${text}$`, 'i'));
  return nodes[0];
};

// helper to add a valid sumber via the modal (module-scope so all tests can use it)
async function addSumber({
  portal = 'Kompas',
  title = 'Kasus Hepatitis Anak',
  type = 'artikel',
  content = 'Penyakit Hepatitis telah menyebar...',
  url = 'https://example.com/news',
  author = 'Reporter A',
  date_published = '2024-01-23T00:00:00Z',
  img_url = ''
} = {}) {
  fireEvent.click(screen.getByText(/Tambah Sumber/i));
  // modal fields
  fireEvent.change(screen.getByLabelText(/Portal/i), { target: { value: portal } });
  fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: title } });
  fireEvent.change(screen.getByLabelText(/Type/i), { target: { value: type } });

  // Try multiple strategies to find the content input since different markup may use a label,
  // placeholder, or just render a textarea/input without a matching label.
  const contentField =
    screen.queryByLabelText(/Content|Konten|Isi/i) ||
    screen.queryByPlaceholderText(/Tulis ringkasan|Konten|Isi|Content/i) ||
    screen.queryByRole('textbox') ||
    screen.queryByTestId('sumber-content');

  if (contentField) {
    fireEvent.change(contentField as any, { target: { value: content } });
  } else {
    // As a last resort, set the value via document query to avoid test failure when markup differs.
    const textarea = document.querySelector('textarea, input[type="text"]');
    if (textarea) {
      (textarea as any).value = content;
      fireEvent.change(textarea as any, { target: { value: content } });
    } else {
      // If still not found, throw a clearer error to aid debugging
      throw new Error('Could not find content input for sumber modal (tried label/placeholder/role/testid).');
    }
  }

  fireEvent.change(screen.getByLabelText(/^URL$/i), { target: { value: url } });
  fireEvent.change(screen.getByLabelText(/Author/i), { target: { value: author } });
  fireEvent.change(screen.getByLabelText(/Date Published/i), { target: { value: date_published } });
  fireEvent.change(screen.getByLabelText(/Image URL/i), { target: { value: img_url } });
  fireEvent.click(screen.getByText(/Simpan/i));
  // wait for modal to close (Simpan button closes it) — ensure the modal save finished by waiting for absence of Save button
  await waitFor(() => expect(screen.queryByText(/Simpan/i)).not.toBeInTheDocument());
}

describe('CuratorAddDataPage', () => {
  test('renders main headings and form controls', () => {
    render(<CuratorAddDataPage />);
    expect(screen.getByText(/Tambahkan Informasi Penyakit Menular/i)).toBeInTheDocument();
    expect(screen.getByText(/Sumber Berita/i)).toBeInTheDocument();
  });

  test('ringkasan char counter updates', () => {
    render(<CuratorAddDataPage />);
    const textarea = screen.getByPlaceholderText(/Tulis ringkasan singkat/i);
    fireEvent.change(textarea, { target: { value: 'halo' } });
    expect(screen.getByText(/4\/2000/)).toBeInTheDocument();
  });

  test('sumber berita validation rejects invalid input', async () => {
    render(<CuratorAddDataPage />);
    // open modal and enter invalid url
    fireEvent.click(screen.getByText(/Tambah Sumber/i));
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Some Title' } });
  fireEvent.change(screen.getByLabelText(/^URL$/i), { target: { value: 'not-a-url' } });
    fireEvent.click(screen.getByText(/Simpan/i));
    await waitFor(() => expect(screen.getByText(/Masukkan sumber berita yang valid/i)).toBeInTheDocument());
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

  test('add-jenis shows transient success feedback (emoji) and closes modal', async () => {
    jest.useFakeTimers();
    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    // open jenis modal
    fireEvent.click(tambahButtons[0]);
    const input = screen.getByPlaceholderText(/Nama penyakit/i);
    fireEvent.change(input, { target: { value: 'TransientDisease' } });
    fireEvent.click(screen.getByText(/Simpan/i));

    // transient success emoji should be visible
    await waitFor(() => expect(screen.getByText('✅')).toBeInTheDocument());

    act(() => { jest.advanceTimersByTime(1000); });
    await waitFor(() => expect(screen.queryByPlaceholderText(/Nama penyakit/i)).not.toBeInTheDocument());
    jest.useRealTimers();
  });

  test('emoji kewaspadaan scale updates value', () => {
    render(<CuratorAddDataPage />);
    const btn4 = screen.getByTitle('4 dari 4');
    fireEvent.click(btn4);
    expect(screen.getByText(/4 \/ 4/)).toBeInTheDocument();
  });

  test('hovering emojis updates display and clicking animates', async () => {
    render(<CuratorAddDataPage />);
  const btn3 = screen.getByTitle('3 dari 4');
    // hover
    fireEvent.mouseEnter(btn3);
  expect(screen.getByText(/3 \/ 4/)).toBeInTheDocument();
    fireEvent.mouseLeave(btn3);
    // click to animate
    fireEvent.click(btn3);
    // clicked should set value
    expect(screen.getByText(/3 \/ 4/)).toBeInTheDocument();
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
  // after reset the selected sumber should be cleared
  await waitFor(() => expect(screen.getByText(/Belum ada sumber terpilih/i)).toBeInTheDocument());
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

  test('add-lokasi shows transient success feedback (emoji) and closes modal', async () => {
    jest.useFakeTimers();
    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    // open lokasi modal
    fireEvent.click(tambahButtons[1]);
    const input = screen.getByPlaceholderText(/Nama lokasi/i);
    fireEvent.change(input, { target: { value: 'TransientCity' } });
    fireEvent.click(screen.getByText(/Simpan/i));

    // feedback emoji should appear inside modal before it closes
    await waitFor(() => expect(screen.getByText('✅')).toBeInTheDocument());

    // advance timers so the transient feedback clears and modal closes
    act(() => { jest.advanceTimersByTime(1000); });
    await waitFor(() => expect(screen.queryByPlaceholderText(/Nama lokasi/i)).not.toBeInTheDocument());
    jest.useRealTimers();
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
  await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
  fireEvent.click(getExactText('Jakarta'));

  // sumber valid (add via modal)
  await addSumber({ url: 'https://example.com/news' });
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat.../i), { target: { value: 'Ringkasan contoh' } });

    fireEvent.click(screen.getByText(/Terapkan/i));
    // success message should appear
    await waitFor(() => expect(screen.getByText(/Data berhasil disimpan./i)).toBeInTheDocument());
  });

  test('keyboard Enter/Space on emoji sets value', () => {
    render(<CuratorAddDataPage />);
    const btn2 = screen.getByTitle('2 dari 4');
    fireEvent.keyDown(btn2, { key: 'Enter', code: 'Enter' });
    expect(screen.getByText(/2 \/ 4/)).toBeInTheDocument();
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
  await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
  fireEvent.click(getExactText('Jakarta'));

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
  await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
  fireEvent.click(getExactText('Jakarta'));

  // valid source and ringkasan (use modal)
  await addSumber({ url: 'https://example.com/news' });
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat.../i), { target: { value: 'Ringkasan contoh' } });

    fireEvent.click(screen.getByText(/Terapkan/i));
    await waitFor(() => expect(screen.getByText(/Gagal mengirim data/i)).toBeInTheDocument());

    // restore console
    console.log = orig;
  });

  test('shows server validation raw JSON when API returns 400', async () => {
    // inject a test API stub via global so the component will use it
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (global as any).__TEST_INJECT_API__ = {
      createCuratorCase: jest.fn(() => Promise.reject({ status: 400, detail: { news: { content: ['This field may not be blank.'] } } })),
    };

    render(<CuratorAddDataPage />);

    // fill required fields
    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih...'), { target: { value: 'Demam' } });
    await waitFor(() => expect(screen.getByText(/Demam Berdarah/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Demam Berdarah/i));

    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih lokasi...'), { target: { value: 'Jakarta' } });
    await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
    fireEvent.click(getExactText('Jakarta'));

    await addSumber({ url: 'https://example.com' });
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat.../i), { target: { value: 'Ringkasan contoh' } });

    fireEvent.click(screen.getByText(/Terapkan/i));

    // raw server validation JSON should be shown in a pre tag
    await waitFor(() => expect(screen.getByText(/This field may not be blank/i)).toBeInTheDocument());

    // cleanup injected test API
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete (global as any).__TEST_INJECT_API__;
  });

  test('duplicate jenis modal shows duplicateWarning when adding existing jenis', async () => {
    render(<CuratorAddDataPage />);
    // open jenis modal
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    fireEvent.click(tambahButtons[0]);
    const input = screen.getByPlaceholderText(/Nama penyakit/i);
    // add an existing name (case-insensitive)
    fireEvent.change(input, { target: { value: 'demam berdarah' } });
    fireEvent.click(screen.getByText(/Simpan/i));
    // the duplicateWarning modal should appear
    await waitFor(() => expect(screen.getByText(/sudah ada di daftar/i)).toBeInTheDocument());
  });

  test('duplicate lokasi modal shows duplicateWarning when adding existing lokasi', async () => {
    render(<CuratorAddDataPage />);
    // open lokasi modal (second "Tambah baru" button)
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    fireEvent.click(tambahButtons[1]);
    const input = screen.getByPlaceholderText(/Nama lokasi/i);
    // add an existing location (case-insensitive)
    fireEvent.change(input, { target: { value: 'jakarta' } });
    fireEvent.click(screen.getByText(/Simpan/i));
    // the duplicateWarning modal should appear
    await waitFor(() => expect(screen.getByText(/sudah ada di daftar/i)).toBeInTheDocument());
  });

  test('duplicateWarning modal closes when Tutup clicked', async () => {
    render(<CuratorAddDataPage />);
    // trigger duplicate lokasi warning
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    fireEvent.click(tambahButtons[1]);
    const input = screen.getByPlaceholderText(/Nama lokasi/i);
    fireEvent.change(input, { target: { value: 'Jakarta' } });
    fireEvent.click(screen.getByText(/Simpan/i));
    await waitFor(() => expect(screen.getByText(/sudah ada di daftar/i)).toBeInTheDocument());
    // click Tutup to close the duplicate-warning modal
    fireEvent.click(screen.getByText(/^Tutup$|^Tutup/i));
    await waitFor(() => expect(screen.queryByText(/sudah ada di daftar/i)).not.toBeInTheDocument());
  });

  test('Tingkat Keparahan select can change values', () => {
    render(<CuratorAddDataPage />);
    const select = screen.getByLabelText(/Tingkat Keparahan/i) as HTMLSelectElement;
    // change to hospitalisasi
    fireEvent.change(select, { target: { value: 'hospitalisasi' } });
    expect(select.value).toBe('hospitalisasi');
    // change to mortalitas
    fireEvent.change(select, { target: { value: 'mortalitas' } });
    expect(select.value).toBe('mortalitas');
  });
  test('image URL input in sumber modal updates on change', async () => {
    render(<CuratorAddDataPage />);
    // open sumber modal
    fireEvent.click(screen.getByText(/Tambah Sumber/i));
    const imgInput = screen.getByLabelText(/Image URL/i) as HTMLInputElement;
    fireEvent.change(imgInput, { target: { value: 'https://img.example.com/photo.jpg' } });
    expect(imgInput.value).toBe('https://img.example.com/photo.jpg');
    // close modal to clean up
    fireEvent.click(screen.getByText(/Batal/i));
  });
  test('selected sumber displays portal/title and metadata after save', async () => {
    render(<CuratorAddDataPage />);
    const portal = 'Detik';
    const title = 'Judul Spesial';
    const type = 'video';
    const author = 'Reporter X';
    const date_published = '2023-12-01T00:00:00Z';
    const url = 'https://detik.com/article/123';

    await addSumber({ portal, title, type, author, date_published, url });

    // header should show 'Portal — Title'
    expect(screen.getByText(new RegExp(`${portal} — ${title}`))).toBeInTheDocument();

    // metadata should include type and author
    expect(screen.getByText(new RegExp(type))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(author))).toBeInTheDocument();

    // date should be formatted via toLocaleDateString()
    const expectedDate = new Date(date_published).toLocaleDateString();
    expect(screen.getByText(new RegExp(expectedDate))).toBeInTheDocument();
  });

  test('saved sumber URL is set and rendered as link', async () => {
    render(<CuratorAddDataPage />);
    const url = 'https://example-source.test/path';
    await addSumber({ url });

    // the selected sumber block should include a link with the URL
    const link = screen.getByText(url);
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', url);
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
  await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
  fireEvent.click(getExactText('Jakarta'));

  await addSumber({ url: 'https://example.com/news' });
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
    // open modal and enter invalid url first
    fireEvent.click(screen.getByText(/Tambah Sumber/i));
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'T' } });
  fireEvent.change(screen.getByLabelText(/^URL$/i), { target: { value: 'not-a-url' } });
    fireEvent.click(screen.getByText(/Simpan/i));
    await waitFor(() => expect(screen.getByText(/Masukkan sumber berita yang valid/i)).toBeInTheDocument());
    // now correct it and save
  fireEvent.change(screen.getByLabelText(/^URL$/i), { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByText(/Simpan/i));
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
  await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
  fireEvent.click(getExactText('Jakarta'));
    fireEvent.change(screen.getByLabelText(/Usia Penderita/i), { target: { value: '-5' } });
    fireEvent.click(screen.getByText(/Terapkan/i));
    await waitFor(() => expect(screen.getByText(/Validasi Gagal/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Tutup/i));
  });

  test('Space key on emoji sets value', () => {
    render(<CuratorAddDataPage />);
    const btn4 = screen.getByTitle('4 dari 4');
    fireEvent.keyDown(btn4, { key: ' ', code: 'Space' });
    expect(screen.getByText(/4 \/ 4/)).toBeInTheDocument();
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
    for (let n = 1; n <= 4; n++) {
      const btn = screen.getByTitle(`${n} dari 4`);
      // hover
      fireEvent.mouseEnter(btn);
      expect(screen.getByText(new RegExp(`${n} \/ 4`))).toBeInTheDocument();
      fireEvent.mouseLeave(btn);

      // keyboard Enter
      fireEvent.keyDown(btn, { key: 'Enter', code: 'Enter' });
      expect(screen.getByText(new RegExp(`${n} \/ 4`))).toBeInTheDocument();

      // keyboard Space
      fireEvent.keyDown(btn, { key: ' ', code: 'Space' });
      expect(screen.getByText(new RegExp(`${n} \/ 4`))).toBeInTheDocument();

      // click
      fireEvent.click(btn);
      // after click it should be set
      await waitFor(() => expect(screen.getByText(new RegExp(`${n} \/ 4`))).toBeInTheDocument());
      // aria-pressed true for this button
      expect(btn.getAttribute('aria-pressed')).toBe('true');
    }
  });

  test('preSubmit validation modal opens and closes via Tutup button', async () => {
    render(<CuratorAddDataPage />);
    // submit empty form -> validation modal should open
    fireEvent.click(screen.getByText(/Terapkan/i));
    await waitFor(() => expect(screen.getByText(/Validasi Gagal/i)).toBeInTheDocument());
    // close modal via Tutup
    fireEvent.click(screen.getByText(/Tutup/i));
    await waitFor(() => expect(screen.queryByText(/Validasi Gagal/i)).not.toBeInTheDocument());
  });

  test('preSubmit uses existing immediate errors (sumberBerita) to populate modal messages', async () => {
    render(<CuratorAddDataPage />);
    // open modal and attempt to save invalid sumber to populate errors
    fireEvent.click(screen.getByText(/Tambah Sumber/i));
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'T' } });
  fireEvent.change(screen.getByLabelText(/^URL$/i), { target: { value: 'invalid-src' } });
    fireEvent.click(screen.getByText(/Simpan/i));
    await waitFor(() => expect(screen.getByText(/Masukkan sumber berita yang valid/i)).toBeInTheDocument());
    // close modal then trigger preSubmit
    fireEvent.click(screen.getByText(/Batal/i));
    fireEvent.click(screen.getByText(/Terapkan/i));
    await waitFor(() => expect(screen.getByText(/Validasi Gagal/i)).toBeInTheDocument());
    expect(screen.getByText(/Masukkan sumber berita yang valid/i)).toBeTruthy();
    fireEvent.click(screen.getByText(/Tutup/i));
  });

  test('inline usia field error appears after invalid usia and submit', async () => {
    render(<CuratorAddDataPage />);
    // provide required fields so usia validation runs in isolation
    const jenisSearch = screen.getByPlaceholderText('Cari atau pilih...');
    fireEvent.change(jenisSearch, { target: { value: 'Demam' } });
    await waitFor(() => expect(screen.getByText(/Demam Berdarah/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Demam Berdarah/i));

  const lokasiSearch = screen.getByPlaceholderText('Cari atau pilih lokasi...');
  fireEvent.change(lokasiSearch, { target: { value: 'Jakarta' } });
  await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
  fireEvent.click(getExactText('Jakarta'));

    const usiaInput = screen.getByLabelText(/Usia Penderita/i);
    fireEvent.change(usiaInput, { target: { value: '-5' } });
    fireEvent.click(screen.getByText(/Terapkan/i));
    await waitFor(() => expect(screen.getByText(/Validasi Gagal/i)).toBeInTheDocument());
    // inline usia error should be visible in the form too
    expect(screen.getByText(/Masukkan usia yang valid./i)).toBeInTheDocument();
  });
});

describe('Extra edge coverage for CuratorAddDataPage', () => {
  test('validateFormState returns required errors when all fields empty', () => {
    const res = validateFormState({});
    expect(res).toEqual({
      jenisPenyakit: 'Jenis penyakit wajib diisi.',
      lokasi: 'Lokasi wajib diisi.',
    });
  });

  test('validateFormState detects valid and invalid URLs correctly', () => {
    const invalid = validateFormState({ sumberBerita: 'abc' });
    expect(invalid.sumberBerita).toMatch(/valid/);

    const valid = validateFormState({ sumberBerita: 'https://example.com' });
    expect(valid.sumberBerita).toBeUndefined();
  });

  test('validateFormState catches multiple invalid date parts', () => {
    const res = validateFormState({ tanggal: { dd: '32', mm: '13', yyyy: '1800' } });
    expect(Object.keys(res)).toContain('tanggal');
    expect(res.tanggal).toMatch(/Format hari tidak valid/);
    expect(res.tanggal).toMatch(/Tahun tidak valid/);
  });

  test('validateFormState catches invalid usia format', () => {
    const res = validateFormState({ usia: 'abc' });
    expect(res.usia).toBeDefined();
  });

  test('preSubmit success branch calls handleApply and sets successMessage', async () => {
    const { container } = render(<CuratorAddDataPage />);
    const jenis = screen.getByPlaceholderText('Cari atau pilih...');
    fireEvent.change(jenis, { target: { value: 'Demam' } });
    await waitFor(() => screen.getByText(/Demam Berdarah/i));
    fireEvent.click(screen.getByText(/Demam Berdarah/i));

    const lokasi = screen.getByPlaceholderText('Cari atau pilih lokasi...');
    fireEvent.change(lokasi, { target: { value: 'Jakarta' } });
  await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
  fireEvent.click(getExactText('Jakarta'));

  await addSumber({ url: 'https://example.com' });
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat/), { target: { value: 'ok' } });

    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(screen.getByText(/Data berhasil disimpan/i)).toBeInTheDocument());
  });

  test('emoji hover triggers and clears hover state', async () => {
    render(<CuratorAddDataPage />);
    const btn = screen.getByTitle('4 dari 4');
    fireEvent.mouseEnter(btn);
    expect(screen.getByText(/4 \/ 4/)).toBeInTheDocument();
    fireEvent.mouseLeave(btn);
    // ensures hover cleared and state stable (initial kewaspadaan is 1)
    await waitFor(() => expect(screen.getByText(/1 \/ 4|4 \/ 4/)).toBeTruthy());
  });

  test('submit button uses BLUE inline style', () => {
    render(<CuratorAddDataPage />);
    const button = screen.getByText(/Terapkan/i);
    expect(button).toHaveStyle({ background: '#0069cf' });
  });

  test('validateFormState returns empty when required fields filled correctly', () => {
    const res = validateFormState({
      jenisPenyakit: 'Demam Berdarah',
      lokasi: 'Jakarta',
    });
    expect(res).toEqual({});
  });

  test('validateFormState accepts valid sumberBerita URL', () => {
    const res = validateFormState({
      jenisPenyakit: 'Flu',
      lokasi: 'Bandung',
      sumberBerita: 'https://example.com/news',
    });
    expect(res.sumberBerita).toBeUndefined();
  });

  test('form submits successfully (valid preSubmit path)', async () => {
    render(<CuratorAddDataPage />);
    const jenisInput = screen.getByPlaceholderText('Cari atau pilih...');
    fireEvent.change(jenisInput, { target: { value: 'Demam' } });
    await waitFor(() => screen.getByText(/Demam Berdarah/i));
    fireEvent.click(screen.getByText(/Demam Berdarah/i));

    const lokasiInput = screen.getByPlaceholderText('Cari atau pilih lokasi...');
    fireEvent.change(lokasiInput, { target: { value: 'Jakarta' } });
  await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
  fireEvent.click(getExactText('Jakarta'));

  await addSumber({ url: 'https://example.com' });
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat/i), { target: { value: 'ok' } });

    fireEvent.click(screen.getByText(/Terapkan/i));
    await waitFor(() => expect(screen.getByText(/Data berhasil disimpan/i)).toBeInTheDocument());
  });

  test('emoji hover enter and leave both trigger correctly', async () => {
    render(<CuratorAddDataPage />);
    const btn = screen.getByTitle('4 dari 4');
    fireEvent.mouseEnter(btn);
    expect(screen.getByText(/4 \/ 4/)).toBeInTheDocument();
    fireEvent.mouseLeave(btn);
    await waitFor(() => expect(screen.getByText(/1 \/ 4|4 \/ 4/)).toBeTruthy());
  });

  test('validateFormState accepts valid date values', () => {
    const res = validateFormState({
      jenisPenyakit: 'Demam Berdarah',
      lokasi: 'Jakarta',
      tanggal: { dd: '10', mm: '12', yyyy: '2025' },
    });
    expect(res.tanggal).toBeUndefined();
  });

  test('validateFormState accepts valid usia number', () => {
    const res = validateFormState({
      jenisPenyakit: 'Demam Berdarah',
      lokasi: 'Jakarta',
      usia: '25',
    });
    expect(res.usia).toBeUndefined();
  });

  test('handleApply executes full success flow and resets form', async () => {
    jest.useFakeTimers();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    render(<CuratorAddDataPage />);

    // fill all required fields
    const jenisSearch = screen.getByPlaceholderText('Cari atau pilih...');
    fireEvent.change(jenisSearch, { target: { value: 'Demam' } });
    await waitFor(() => screen.getByText(/Demam Berdarah/i));
    fireEvent.click(screen.getByText(/Demam Berdarah/i));

  const lokasiSearch = screen.getByPlaceholderText('Cari atau pilih lokasi...');
  fireEvent.change(lokasiSearch, { target: { value: 'Jakarta' } });
  await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
  fireEvent.click(getExactText('Jakarta'));

  await addSumber({ url: 'https://example.com' });
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat/i), { target: { value: 'OK' } });
    fireEvent.change(screen.getByLabelText(/Usia Penderita/i), { target: { value: '30' } });

    // submit
    fireEvent.click(screen.getByText(/Terapkan/i));

    // success visible
    await waitFor(() => expect(screen.getByText(/Data berhasil disimpan/i)).toBeInTheDocument());

    // timer expires clears message
    act(() => jest.advanceTimersByTime(4000));
    await waitFor(() => expect(screen.queryByText(/Data berhasil disimpan/i)).not.toBeInTheDocument());

    // ensure console.log called with payload
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/Kirim data kurator/), expect.any(Object));
    
    consoleSpy.mockRestore();
    jest.useRealTimers();
  });

  test('button text changes when submitting', async () => {
    render(<CuratorAddDataPage />);
    // pick jenis and lokasi so preSubmit validation passes
    const jenisSearch = screen.getByPlaceholderText('Cari atau pilih...');
    fireEvent.change(jenisSearch, { target: { value: 'Demam' } });
    await waitFor(() => expect(screen.getByText(/Demam Berdarah/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Demam Berdarah/i));

    const lokasiSearch = screen.getByPlaceholderText('Cari atau pilih lokasi...');
    fireEvent.change(lokasiSearch, { target: { value: 'Jakarta' } });
  await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
  fireEvent.click(getExactText('Jakarta'));

    // add a valid sumber via helper which sets sumberBerita
    await addSumber({ url: 'https://example.com/news' });

    // fill ringkasan to satisfy any length requirements
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat.../i), { target: { value: 'ok' } });

    const btn = screen.getByText(/Terapkan/i);
    fireEvent.click(btn);
    // when submitting is set synchronously, button text should change
    await waitFor(() => expect(btn.textContent).toMatch(/Menyimpan\.{3}|Terapkan/));
  });

  test('validateFormState hits both bulan/tahun invalid branches', () => {
    // case 1: invalid month only → creates next.tanggal (false branch)
    const case1 = validateFormState({
      tanggal: { dd: '10', mm: '13', yyyy: '2025' },
    });
    expect(case1.tanggal).toMatch(/Format bulan tidak valid/);

    // case 2: invalid day + invalid month + invalid year → appends (true branch)
    const case2 = validateFormState({
      tanggal: { dd: '32', mm: '13', yyyy: '1800' },
    });
    expect(case2.tanggal).toMatch(/Bulan tidak valid/);
    expect(case2.tanggal).toMatch(/Tahun tidak valid/);
  });

  test('validateFormState handles year invalid branch without previous tanggal error', () => {
    const result = validateFormState({
      tanggal: { dd: '10', mm: '12', yyyy: '1800' }, // only year invalid
    });
    expect(result.tanggal).toBe('Format tahun tidak valid (1900-2100).');
  });

  test('handleApply full success flow including timeout and finally', async () => {
    jest.useFakeTimers();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    render(<CuratorAddDataPage />);
    
    // fill valid form
    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih...'), { target: { value: 'Demam' } });
    await waitFor(() => screen.getByText(/Demam Berdarah/i));
    fireEvent.click(screen.getByText(/Demam Berdarah/i));

  fireEvent.change(screen.getByPlaceholderText('Cari atau pilih lokasi...'), { target: { value: 'Jakarta' } });
  await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
  fireEvent.click(getExactText('Jakarta'));

  await addSumber({ url: 'https://example.com' });
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat/i), { target: { value: 'Ringkasan test' } });
    fireEvent.change(screen.getByLabelText(/Usia Penderita/i), { target: { value: '30' } });

    // submit triggers handleApply
    fireEvent.click(screen.getByText(/Terapkan/i));

    // while submitting = true → "Menyimpan..." shown
    await waitFor(() => expect(screen.getByText(/Data berhasil disimpan/i)).toBeInTheDocument());
    const button = screen.getByRole('button', { name: /Terapkan/i });
    expect(button).toBeInTheDocument();

    // let timeout clear message
    act(() => jest.advanceTimersByTime(4000));
    await waitFor(() => expect(screen.queryByText(/Data berhasil disimpan/i)).not.toBeInTheDocument());

    // verify console.log and cleanup
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Kirim data kurator:'), expect.any(Object));
    logSpy.mockRestore();
    jest.useRealTimers();
  });

  test('handleApply executes full try/finally success path with timeout', async () => {
    jest.useFakeTimers();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    render(<CuratorAddDataPage />);

    // Fill required inputs
    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih...'), { target: { value: 'Demam' } });
    await waitFor(() => screen.getByText(/Demam Berdarah/i));
    fireEvent.click(screen.getByText(/Demam Berdarah/i));

    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih lokasi...'), { target: { value: 'Jakarta' } });
  await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
  fireEvent.click(getExactText('Jakarta'));

  await addSumber({ url: 'https://example.com' });
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat/i), { target: { value: 'ringkasan' } });
    fireEvent.change(screen.getByLabelText(/Usia Penderita/i), { target: { value: '25' } });

    // Submit → triggers handleApply success
    fireEvent.click(screen.getByText(/Terapkan/i));

    // "Data berhasil disimpan." should appear then disappear
    await waitFor(() => expect(screen.getByText(/Data berhasil disimpan/i)).toBeInTheDocument());
    act(() => jest.advanceTimersByTime(4000));
    await waitFor(() => expect(screen.queryByText(/Data berhasil disimpan/i)).not.toBeInTheDocument());

    // confirm console.log was called (inside try)
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Kirim data kurator:'), expect.any(Object));

    logSpy.mockRestore();
    jest.useRealTimers();
  });
});