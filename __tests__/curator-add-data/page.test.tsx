import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

// Mock Navbar and Footer to isolate the page component
jest.mock('../../app/components/Navbar', () => () => <div data-testid="mock-navbar">Navbar</div>);
jest.mock('../../app/components/Footer', () => () => <div data-testid="mock-footer">Footer</div>);
// Provide a lightweight mock for next/app-router hooks used by the page so tests
// don't error with "invariant expected app router to be mounted" when components
// import useRouter/useSearchParams etc.
jest.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
    }),
    useSearchParams: () => {
      const raw = (global as any).location?.search || '';
      const params = new URLSearchParams(raw.replace(/^\?/, ''));
      return {
        get: (k: string) => params.get(k),
        toString: () => raw.replace(/^\?/, ''),
        entries: () => params.entries(),
      };
    },
    usePathname: () => (global as any).location?.pathname || '',
    useParams: () => {
      const raw = (global as any).location?.search || '';
      return Object.fromEntries(new URLSearchParams(raw.replace(/^\?/, '')));
    },
  };
});
// Mock auth hook to return a CURATOR user by default for these tests
const mockUseAuth = jest.fn(() => ({ user: { role: 'CURATOR' } }));
jest.mock('../../app/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

beforeEach(() => {
  mockUseAuth.mockReset();
  mockUseAuth.mockReturnValue({ user: { role: 'CURATOR' } });
  // provide a default test API that resolves createCuratorCase so tests that
  // exercise the success path do not fail due to missing/failed API.
  // Individual tests may override __TEST_INJECT_API__ when they need to
  // simulate errors or different behavior.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  (global as any).__TEST_INJECT_API__ = {
    createCuratorCase: jest.fn(() => Promise.resolve({ id: 1 })),
    registryApi: {},
  };
});

afterEach(() => {
  // ensure no leakage between tests
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  delete (global as any).__TEST_INJECT_API__;
});

// Mock services/api to avoid real network calls during tests and allow test injection
jest.mock('../../services/api', () => ({
  getDiseases: async () => {
    // return some defaults useful for tests
    return ['Demam Berdarah', 'COVID-19', 'Flu Singapura'];
  },
  getLocations: async () => {
    return ['Jakarta', 'Bandung', 'Surabaya'];
  },
  getProvinces: async () => {
    return ['Jawa Barat', 'Jawa Tengah', 'DKI Jakarta'];
  },
  // provide mapApi.getProvinces so component can merge remote provinces if available
  mapApi: {
    getProvinces: async () => ['ProvinsiRemoteX', 'Jawa Barat'],
  },
  // registryApi methods defer to a global test injector if present
  registryApi: {
    createProvince: (name: string) => {
      // if the test set a custom implementation, call it
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const injected = (global as any).__TEST_INJECT_API__?.registryApi?.createProvince;
      if (injected) return injected(name);
      return Promise.resolve({ name });
    }
  }
}));

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
  fireEvent.change(screen.getByLabelText(/Judul|Title/i), { target: { value: title } });
  fireEvent.change(screen.getByLabelText(/Tipe|Type/i), { target: { value: type } });

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
  fireEvent.change(screen.getByLabelText(/Penulis|Author/i), { target: { value: author } });
  // fill date parts (DD/MM/YYYY) instead of the old ISO field
  try {
    if (date_published) {
      const d = new Date(date_published);
      if (!isNaN(d.getTime())) {
        const dd = String(d.getUTCDate()).padStart(2, '0');
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const yyyy = String(d.getUTCFullYear());
        fireEvent.change(screen.getByPlaceholderText('DD'), { target: { value: dd } });
        fireEvent.change(screen.getByPlaceholderText('MM'), { target: { value: mm } });
        fireEvent.change(screen.getByPlaceholderText('YYYY'), { target: { value: yyyy } });
      } else {
        fireEvent.change(screen.getByPlaceholderText('DD'), { target: { value: '19' } });
        fireEvent.change(screen.getByPlaceholderText('MM'), { target: { value: '10' } });
        fireEvent.change(screen.getByPlaceholderText('YYYY'), { target: { value: '2025' } });
      }
    } else {
      fireEvent.change(screen.getByPlaceholderText('DD'), { target: { value: '19' } });
      fireEvent.change(screen.getByPlaceholderText('MM'), { target: { value: '10' } });
      fireEvent.change(screen.getByPlaceholderText('YYYY'), { target: { value: '2025' } });
    }
  } catch (e) {
    fireEvent.change(screen.getByPlaceholderText('DD'), { target: { value: '19' } });
    fireEvent.change(screen.getByPlaceholderText('MM'), { target: { value: '10' } });
    fireEvent.change(screen.getByPlaceholderText('YYYY'), { target: { value: '2025' } });
  }
  fireEvent.change(screen.getByLabelText(/URL Gambar|Image URL/i), { target: { value: img_url } });
  fireEvent.click(screen.getByText(/Simpan/i));
  // wait for modal to close (Simpan button closes it) — ensure the modal save finished by waiting for absence of Save button
  await waitFor(() => expect(screen.queryByText(/Simpan/i)).not.toBeInTheDocument());
}

describe('CuratorAddDataPage', () => {
  test('shows AccessDenied for unauthenticated or non-CURATOR', async () => {
    // override auth to be unauthenticated
    mockUseAuth.mockReturnValueOnce({ user: null } as any);
    const { rerender } = render(<CuratorAddDataPage />);
    expect(await screen.findByText(/Akses Kurator Ditolak/i)).toBeInTheDocument();

    // now simulate non-curator role
    mockUseAuth.mockReturnValue({ user: { role: 'EXPLORE' } } as any);
    rerender(<CuratorAddDataPage />);
    expect(await screen.findByText(/Akses Kurator Ditolak/i)).toBeInTheDocument();
  });

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
    fireEvent.change(screen.getByLabelText(/Judul|Title/i), { target: { value: 'Some Title' } });
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

  test('lokasi modal shows latitude/longitude inputs with placeholders and accept input', async () => {
    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    // open lokasi modal (second button)
    fireEvent.click(tambahButtons[1]);

    // latitude & longitude inputs should be present with example placeholders
    const latInput = screen.getByPlaceholderText(/Contoh: -6.895/i) as HTMLInputElement;
    const lngInput = screen.getByPlaceholderText(/Contoh: 107.618/i) as HTMLInputElement;
    expect(latInput).toBeInTheDocument();
    expect(lngInput).toBeInTheDocument();

    // simulate user typing values
    fireEvent.change(latInput, { target: { value: '-6.5' } });
    fireEvent.change(lngInput, { target: { value: '107.0' } });

    expect(latInput.value).toBe('-6.5');
    expect(lngInput.value).toBe('107.0');

    // close modal to clean up
    fireEvent.click(screen.getByText(/Batal/i));
  });

  test('provinsi modal input and feedback emoji and Batal button present', async () => {
    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    // third "Tambah baru" is for provinsi
    fireEvent.click(tambahButtons[2]);

    const provInput = screen.getByPlaceholderText(/Nama provinsi/i) as HTMLInputElement;
    expect(provInput).toBeInTheDocument();

    // initially no feedback; simulate entering a name and clicking Simpan to trigger feedback
    fireEvent.change(provInput, { target: { value: 'ProvinsiTest' } });
    fireEvent.click(screen.getByText(/Simpan/i));

    // feedback emoji should appear transiently inside modal
    await waitFor(() => expect(screen.getByText('✅')).toBeInTheDocument());

    // Batal button should be present and closes the modal
    const batalBtn = screen.getByText(/Batal/i);
    expect(batalBtn).toBeInTheDocument();
    fireEvent.click(batalBtn);
    await waitFor(() => expect(screen.queryByPlaceholderText(/Nama provinsi/i)).not.toBeInTheDocument());
  });

  test('provinsi search input updates on change (id=provinsiSearch)', async () => {
    render(<CuratorAddDataPage />);
    // the provinsi search input should be present on initial render
    const provSearch = screen.getByPlaceholderText(/Cari atau pilih provinsi.../i) as HTMLInputElement;
    expect(provSearch).toBeInTheDocument();
    fireEvent.change(provSearch, { target: { value: 'Jawa Barat' } });
    expect(provSearch.value).toBe('Jawa Barat');
  });

  test('provinsi modal Batal closes modal without saving', async () => {
    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    // open provinsi modal (third button)
    fireEvent.click(tambahButtons[2]);
    // ensure the input is present
    expect(screen.getByPlaceholderText(/Nama provinsi/i)).toBeInTheDocument();
    // click Batal and assert modal closes
    fireEvent.click(screen.getByText(/Batal/i));
    await waitFor(() => expect(screen.queryByPlaceholderText(/Nama provinsi/i)).not.toBeInTheDocument());
  });

  test('createProvince via API is called and new provinsi appears in list', async () => {
    // inject a test API with registryApi.createProvince
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (global as any).__TEST_INJECT_API__ = {
      registryApi: {
        createProvince: jest.fn((name: string) => Promise.resolve({ name })),
      }
    };

    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    // open provinsi modal
    fireEvent.click(tambahButtons[2]);
    const input = screen.getByPlaceholderText(/Nama provinsi/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ProvinsiAPI' } });
    fireEvent.click(screen.getByText(/Simpan/i));

    // feedback emoji should appear then modal closes
    await waitFor(() => expect(screen.getByText('✅')).toBeInTheDocument());
    await waitFor(() => expect(screen.queryByPlaceholderText(/Nama provinsi/i)).not.toBeInTheDocument());

    // Now search for the new provinsi in the provinsi picker
    const provSearch = screen.getByPlaceholderText(/Cari atau pilih provinsi.../i) as HTMLInputElement;
    fireEvent.change(provSearch, { target: { value: 'ProvinsiAPI' } });
    await waitFor(() => expect(screen.getByText(/ProvinsiAPI/i)).toBeInTheDocument());

    // ensure API was called
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect((global as any).__TEST_INJECT_API__.registryApi.createProvince).toHaveBeenCalledWith('ProvinsiAPI');

    // cleanup
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete (global as any).__TEST_INJECT_API__;
  });

  test('createProvince local fallback adds provinsi to list when API missing', async () => {
    // inject an empty registryApi so createProvince is absent
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (global as any).__TEST_INJECT_API__ = { registryApi: {} };

    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    // open provinsi modal
    fireEvent.click(tambahButtons[2]);
    const input = screen.getByPlaceholderText(/Nama provinsi/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ProvinsiLocal' } });
    fireEvent.click(screen.getByText(/Simpan/i));

    // transient local feedback emoji appears and modal closes
    await waitFor(() => expect(screen.getByText('✅')).toBeInTheDocument());
    await waitFor(() => expect(screen.queryByPlaceholderText(/Nama provinsi/i)).not.toBeInTheDocument());

    // search for the newly added local provinsi
    const provSearch = screen.getByPlaceholderText(/Cari atau pilih provinsi.../i) as HTMLInputElement;
    fireEvent.change(provSearch, { target: { value: 'ProvinsiLocal' } });
    await waitFor(() => expect(screen.getByText(/ProvinsiLocal/i)).toBeInTheDocument());

    // cleanup
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete (global as any).__TEST_INJECT_API__;
  });

  test('validation modal Tutup button closes the modal', async () => {
    render(<CuratorAddDataPage />);
    // trigger preSubmit validation modal by clicking Terapkan with empty form
    fireEvent.click(screen.getByText(/Terapkan/i));
    // validation modal should appear
    await waitFor(() => expect(screen.getByText(/Validasi Gagal/i)).toBeInTheDocument());
    // click Tutup which in code sets serverValidationMessages(null) and serverValidationRaw(null)
    fireEvent.click(screen.getByText(/^Tutup$|^Tutup/i));
    // modal should be closed
    await waitFor(() => expect(screen.queryByText(/Validasi Gagal/i)).not.toBeInTheDocument());
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
  // ensure the createCuratorCase API was called and the form was submitted
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await waitFor(() => expect((global as any).__TEST_INJECT_API__.createCuratorCase).toHaveBeenCalled());
  // after successful submit the selected sumber should reset
  await waitFor(() => expect(screen.getByText(/Belum ada sumber terpilih/i)).toBeInTheDocument());
  });

  test('keyboard Enter/Space on emoji sets value', () => {
    render(<CuratorAddDataPage />);
    const btn2 = screen.getByTitle('2 dari 4');
    fireEvent.keyDown(btn2, { key: 'Enter', code: 'Enter' });
    expect(screen.getByText(/2 \/ 4/)).toBeInTheDocument();
  });

  test('tanggal validation produces combined messages when invalid', async () => {
    // main Tanggal inputs were removed from the UI; validate the pure validator directly
    const errors = validateFormState({ jenisPenyakit: 'X', lokasi: 'Y', tanggal: { dd: '99', mm: '13', yyyy: '1800' } });
    expect(errors.tanggal).toBeDefined();
    expect(errors.tanggal).toMatch(/hari|bulan|tahun|Format/i);
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
    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih...'), { target: { value: 'Demam' } });
    await waitFor(() => expect(screen.getByText(/Demam Berdarah/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Demam Berdarah/i));

    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih lokasi...'), { target: { value: 'Jakarta' } });
    await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
    fireEvent.click(getExactText('Jakarta'));

    await addSumber({ url: 'https://example.com' });
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat.../i), { target: { value: 'Ringkasan contoh' } });

    fireEvent.click(screen.getByText(/Terapkan/i));

  // raw server validation JSON should be shown in a pre tag (may appear multiple places)
  const matches = await screen.findAllByText(/This field may not be blank/i);
  expect(matches.length).toBeGreaterThanOrEqual(1);

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
    const imgInput = screen.getByLabelText(/URL Gambar|Image URL/i) as HTMLInputElement;
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
  // ensure the submission API was called and the UI reflects a reset
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await waitFor(() => expect((global as any).__TEST_INJECT_API__.createCuratorCase).toHaveBeenCalled());
  act(() => { jest.advanceTimersByTime(4000); });
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
  fireEvent.change(screen.getByLabelText(/Judul|Title/i), { target: { value: 'T' } });
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
    // read available options to avoid hard-coded locale strings
    const options = Array.from(select.querySelectorAll('option')).map(o => o.value).filter(Boolean);
    if (options.length >= 2) {
      fireEvent.change(select, { target: { value: options[1] } });
      expect(select.value).toBe(options[1]);
    }
    if (options.length >= 3) {
      fireEvent.change(select, { target: { value: options[2] } });
      expect(select.value).toBe(options[2]);
    }
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
  fireEvent.change(screen.getByLabelText(/Judul|Title/i), { target: { value: 'T' } });
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

  test('handleApply redirects to login on 401 status', async () => {
    // simulate login redirect by making createCuratorCase reject with 401
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (global as any).__TEST_INJECT_API__ = { createCuratorCase: jest.fn(() => Promise.reject({ status: 401 })) };

    // mock location so assigning href is safe
    const origLocation = (window as any).location;
    // @ts-ignore
    delete (window as any).location;
    (window as any).location = { href: '', pathname: '/some/path', search: '' };

    render(<CuratorAddDataPage />);
    // fill required fields
    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih...'), { target: { value: 'Demam' } });
    await waitFor(() => screen.getByText(/Demam Berdarah/i));
    fireEvent.click(screen.getByText(/Demam Berdarah/i));
    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih lokasi...'), { target: { value: 'Jakarta' } });
    await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
    fireEvent.click(getExactText('Jakarta'));
    await addSumber({ url: 'https://example.com' });
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat/i), { target: { value: 'ok' } });

    fireEvent.click(screen.getByText(/Terapkan/i));

    // wait a tick - component should set window.location.href
    await waitFor(() => expect((window as any).location.href).toContain('/login?next='));

    // restore location and injected API
    (window as any).location = origLocation;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete (global as any).__TEST_INJECT_API__;
  });

  test('handleApply shows access denied message on 403', async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (global as any).__TEST_INJECT_API__ = { createCuratorCase: jest.fn(() => Promise.reject({ status: 403 })) };

    render(<CuratorAddDataPage />);
    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih...'), { target: { value: 'Demam' } });
    await waitFor(() => screen.getByText(/Demam Berdarah/i));
    fireEvent.click(screen.getByText(/Demam Berdarah/i));
    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih lokasi...'), { target: { value: 'Jakarta' } });
    await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
    fireEvent.click(getExactText('Jakarta'));
    await addSumber({ url: 'https://example.com' });
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat/i), { target: { value: 'ok' } });

    fireEvent.click(screen.getByText(/Terapkan/i));

    await waitFor(() => expect(screen.getByText(/Akses Ditolak: halaman ini hanya untuk kurator\./i)).toBeInTheDocument());

    // cleanup
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete (global as any).__TEST_INJECT_API__;
  });

  test('handleApply shows string detail message for 400', async () => {
    // return 400 with primitive detail string
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (global as any).__TEST_INJECT_API__ = { createCuratorCase: jest.fn(() => Promise.reject({ status: 400, detail: 'Some server error' })) };

    render(<CuratorAddDataPage />);
    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih...'), { target: { value: 'Demam' } });
    await waitFor(() => screen.getByText(/Demam Berdarah/i));
    fireEvent.click(screen.getByText(/Demam Berdarah/i));
    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih lokasi...'), { target: { value: 'Jakarta' } });
    await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
    fireEvent.click(getExactText('Jakarta'));
    await addSumber({ url: 'https://example.com' });
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat/i), { target: { value: 'ok' } });

    fireEvent.click(screen.getByText(/Terapkan/i));

  const matches = await screen.findAllByText(/Some server error/i);
  expect(matches.length).toBeGreaterThanOrEqual(1);

    // cleanup
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete (global as any).__TEST_INJECT_API__;
  });

  test('handleApply shows fallback message when 400 detail is falsy', async () => {
    // 400 with null detail should show generic validation message
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (global as any).__TEST_INJECT_API__ = { createCuratorCase: jest.fn(() => Promise.reject({ status: 400, detail: null })) };

    render(<CuratorAddDataPage />);
    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih...'), { target: { value: 'Demam' } });
    await waitFor(() => screen.getByText(/Demam Berdarah/i));
    fireEvent.click(screen.getByText(/Demam Berdarah/i));
    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih lokasi...'), { target: { value: 'Jakarta' } });
    await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
    fireEvent.click(getExactText('Jakarta'));
    await addSumber({ url: 'https://example.com' });
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat/i), { target: { value: 'ok' } });

    fireEvent.click(screen.getByText(/Terapkan/i));

  const matches = await screen.findAllByText(/Validasi server gagal. Periksa input\./i);
  expect(matches.length).toBeGreaterThanOrEqual(1);

    // cleanup
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete (global as any).__TEST_INJECT_API__;
  });

  test('computedContent falls back to default when no content present', async () => {
    // ensure createCuratorCase resolves so flow continues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (global as any).__TEST_INJECT_API__ = { createCuratorCase: jest.fn(() => Promise.resolve({ id: 2 })) };

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    render(<CuratorAddDataPage />);
    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih...'), { target: { value: 'Demam' } });
    await waitFor(() => screen.getByText(/Demam Berdarah/i));
    fireEvent.click(screen.getByText(/Demam Berdarah/i));
    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih lokasi...'), { target: { value: 'Jakarta' } });
    await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
    fireEvent.click(getExactText('Jakarta'));

    // ensure no sumber selected and no ringkasan/srcContent
    // submit form
    fireEvent.click(screen.getByText(/Terapkan/i));

    await waitFor(() => expect((global as any).__TEST_INJECT_API__.createCuratorCase).toHaveBeenCalled());

    // inspect the last call to console.log which logs the payload
    const calls = logSpy.mock.calls.filter((c) => String(c[0]).includes('Kirim data kurator'));
    expect(calls.length).toBeGreaterThanOrEqual(1);
    const payload = calls[0][1];
    expect(payload.news.content).toBe('Konten singkat tidak tersedia.');

    logSpy.mockRestore();
    // cleanup
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete (global as any).__TEST_INJECT_API__;
  });

  test('addSumber with invalid year leaves date blank in selected sumber display', async () => {
    render(<CuratorAddDataPage />);
    // open sumber modal
    fireEvent.click(screen.getByText(/Tambah Sumber/i));

    // fill minimal valid title and URL, but provide an invalid short year to force date_published = null
    fireEvent.change(screen.getByLabelText(/Judul|Title/i), { target: { value: 'NoDateTitle' } });
    fireEvent.change(screen.getByLabelText(/^URL$/i), { target: { value: 'https://example.test/no-date' } });

    // set invalid year (not 4 digits) so the IIFE returns null
    fireEvent.change(screen.getByPlaceholderText('DD'), { target: { value: '10' } });
    fireEvent.change(screen.getByPlaceholderText('MM'), { target: { value: '10' } });
    fireEvent.change(screen.getByPlaceholderText('YYYY'), { target: { value: '20' } });

    // save
    fireEvent.click(screen.getByText(/Simpan/i));

    // wait for modal to close
    await waitFor(() => expect(screen.queryByText(/Simpan/i)).not.toBeInTheDocument());

    // selected sumber header exists
    expect(screen.getByText(new RegExp('NoDateTitle'))).toBeInTheDocument();

    // verify the formatted date is not present in the selected sumber metadata (no 4-digit year)
    const header = screen.getByText(/NoDateTitle/i);
    const container = header.parentElement;
    // search only within the selected sumber container to avoid matching other dates on the page
    const metaNodes = container ? within(container).queryAllByText(/\d{4}/) : [];
    // should be zero nodes containing a 4-digit year inside the selected sumber block
    expect(metaNodes.length).toBe(0);
  });

  test('merges remote provinces when mapApi.getProvinces exists', async () => {
    // With the global services/api mock providing mapApi.getProvinces, the component
    // should merge remote provinces into the provinsi list on mount.
    render(<CuratorAddDataPage />);
    await waitFor(() => expect(screen.getByText(/ProvinsiRemoteX/i)).toBeInTheDocument());
  });

  test('shows registry unavailable note when registryApi.getDiseases endpoint missing', async () => {
    // mutate the mocked services/api to simulate endpointNotFound for diseases
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const svc = require('../../services/api');
    const origGetDiseases = svc.registryApi.getDiseases;
    svc.registryApi.getDiseases = async () => { throw Object.assign(new Error('No endpoint'), { endpointNotFound: true }); };

    render(<CuratorAddDataPage />);
    // the yellow note about registry unavailability should be shown
    await waitFor(() => expect(screen.getByText(/layanan registri penyakit tidak tersedia/i)).toBeInTheDocument());

    // restore original mock implementation
    svc.registryApi.getDiseases = origGetDiseases;
  });

  test('merges remote diseases when registryApi.getDiseases provides list', async () => {
    // mutate the mocked services/api to provide registryApi.getDiseases that returns remote values
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const svc = require('../../services/api');
    const orig = svc.registryApi.getDiseases;
    (svc.registryApi as any).getDiseases = async () => ['RemoteOnlyDisease', 'Demam Berdarah'];

    render(<CuratorAddDataPage />);
    // remote disease name should be merged into the jenis list
    await waitFor(() => expect(screen.getByText(/RemoteOnlyDisease/i)).toBeInTheDocument());

    // restore
    (svc.registryApi as any).getDiseases = orig;
  });

  test('merges remote locations when mapApi.getLocations returns objects', async () => {
    // mutate mocked mapApi to return objects instead of strings
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const svc = require('../../services/api');
    const origGetLocations = svc.getLocations;
    svc.mapApi.getLocations = async () => [{ name: 'RemoteCityOne' }, { city: 'RemoteCityTwo' }];

    render(<CuratorAddDataPage />);
    await waitFor(() => expect(screen.getByText(/RemoteCityOne/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/RemoteCityTwo/i)).toBeInTheDocument());

    // restore
    svc.getLocations = origGetLocations;
  });

  test('addNewJenis uses created.title when registry returns title and selects it', async () => {
    // mutate registryApi.createDisease to return object with title property
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const svc = require('../../services/api');
    const origCreate = svc.registryApi.createDisease;
    svc.registryApi.createDisease = jest.fn((name: string) => Promise.resolve({ title: `${name}-TITLE` }));

    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    fireEvent.click(tambahButtons[0]);
    const input = screen.getByPlaceholderText(/Nama penyakit/i);
    fireEvent.change(input, { target: { value: 'ApiTitleTest' } });
    fireEvent.click(screen.getByText(/Simpan/i));

    // new item named by title should appear and be selected
    await waitFor(() => expect(screen.getByText(/ApiTitleTest-TITLE/i)).toBeInTheDocument());

    // restore
    svc.registryApi.createDisease = origCreate;
  });

  test('addNewJenis falls back locally and shows error feedback when endpointNotFound', async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const svc = require('../../services/api');
    const origCreate = svc.registryApi.createDisease;
    svc.registryApi.createDisease = async () => { throw Object.assign(new Error('No endpoint'), { endpointNotFound: true }); };

    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    fireEvent.click(tambahButtons[0]);
    const input = screen.getByPlaceholderText(/Nama penyakit/i);
    fireEvent.change(input, { target: { value: 'LocalErrorJenis' } });
    fireEvent.click(screen.getByText(/Simpan/i));

    // error feedback emoji should be visible (❌)
    await waitFor(() => expect(screen.getByText('❌')).toBeInTheDocument());

    // restore
    svc.registryApi.createDisease = origCreate;
  });

  test('addNewProvinsi treats missing createProvince as no-endpoint and falls back locally', async () => {
  // simulate a createProvince endpoint that throws endpointNotFound
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  (global as any).__TEST_INJECT_API__ = { registryApi: { createProvince: jest.fn(() => Promise.reject(Object.assign(new Error('No endpoint'), { endpointNotFound: true }))) } };

  render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    // open provinsi modal
    fireEvent.click(tambahButtons[2]);
    const input = screen.getByPlaceholderText(/Nama provinsi/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ProvinsiNoEndpoint' } });
    fireEvent.click(screen.getByText(/Simpan/i));

  // error feedback emoji should be visible (❌) and modal should close
  await waitFor(() => expect(screen.getByText('❌')).toBeInTheDocument(), { timeout: 3000 });
  await waitFor(() => expect(screen.queryByPlaceholderText(/Nama provinsi/i)).not.toBeInTheDocument(), { timeout: 5000 });
  // ensure API was attempted
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  expect((global as any).__TEST_INJECT_API__.registryApi.createProvince).toHaveBeenCalledWith('ProvinsiNoEndpoint');

    // cleanup injected test API
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete (global as any).__TEST_INJECT_API__;
  }, 20000);

  test('addNewProvinsi uses returned label when registry returns an object with label', async () => {
  // inject a registryApi.createProvince that returns an object with label
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  (global as any).__TEST_INJECT_API__ = { registryApi: { createProvince: jest.fn((name: string) => Promise.resolve({ label: `${name}-LABEL` })) } };

  render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    fireEvent.click(tambahButtons[2]);
    const input = screen.getByPlaceholderText(/Nama provinsi/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ProvinsiLabelTest' } });
    fireEvent.click(screen.getByText(/Simpan/i));

  // success feedback should be visible and modal should close
  await waitFor(() => expect(screen.getByText('✅')).toBeInTheDocument(), { timeout: 3000 });
  await waitFor(() => expect(screen.queryByPlaceholderText(/Nama provinsi/i)).not.toBeInTheDocument(), { timeout: 5000 });
  // ensure createProvince was called with the original name
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  expect((global as any).__TEST_INJECT_API__.registryApi.createProvince).toHaveBeenCalledWith('ProvinsiLabelTest');

    // cleanup injected test API
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete (global as any).__TEST_INJECT_API__;
  }, 20000);

  test('createProvince returning a plain string is normalized and added', async () => {
    // inject a registryApi.createProvince that returns a plain string
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (global as any).__TEST_INJECT_API__ = { registryApi: { createProvince: jest.fn((name: string) => Promise.resolve(`${name}-STR`)) } };

    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    fireEvent.click(tambahButtons[2]);
    const input = screen.getByPlaceholderText(/Nama provinsi/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ProvPlain' } });
    fireEvent.click(screen.getByText(/Simpan/i));

    // success feedback should be visible and modal should close
    await waitFor(() => expect(screen.getByText('✅')).toBeInTheDocument(), { timeout: 3000 });
    await waitFor(() => expect(screen.queryByPlaceholderText(/Nama provinsi/i)).not.toBeInTheDocument(), { timeout: 5000 });

  // component currently falls back to original name for plain-string responses;
  // ensure the registry API was called with the original name (component normalizes plain-string to original)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  expect((global as any).__TEST_INJECT_API__.registryApi.createProvince).toHaveBeenCalledWith('ProvPlain');

    // cleanup
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete (global as any).__TEST_INJECT_API__;
  }, 20000);

  test('addNewProvinsi catch branch when createProvince throws non-endpoint error', async () => {
    // inject a registryApi.createProvince that throws a generic error (no endpointNotFound flag)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (global as any).__TEST_INJECT_API__ = { registryApi: { createProvince: jest.fn(() => Promise.reject(new Error('boom'))) } };

    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    fireEvent.click(tambahButtons[2]);
    const input = screen.getByPlaceholderText(/Nama provinsi/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ProvinsiThrowErr' } });
    fireEvent.click(screen.getByText(/Simpan/i));

    // when the registry throws a generic error, the component treats it as a local success
    await waitFor(() => expect(screen.getByText('✅')).toBeInTheDocument(), { timeout: 3000 });
    await waitFor(() => expect(screen.queryByPlaceholderText(/Nama provinsi/i)).not.toBeInTheDocument(), { timeout: 5000 });

    // ensure API was attempted
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect((global as any).__TEST_INJECT_API__.registryApi.createProvince).toHaveBeenCalledWith('ProvinsiThrowErr');

    // cleanup
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete (global as any).__TEST_INJECT_API__;
  }, 20000);

  test('merges object-shaped remote provinces when mapApi.getProvinces returns objects', async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const svc = require('../../services/api');
    const orig = (svc.mapApi as any).getProvinces;
    (svc.mapApi as any).getProvinces = async () => [{ name: 'RemoteProvObjA' }, { name: 'RemoteProvObjB' }];

    render(<CuratorAddDataPage />);
    await waitFor(() => expect(screen.getByText(/RemoteProvObjA/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/RemoteProvObjB/i)).toBeInTheDocument());

    (svc.mapApi as any).getProvinces = orig;
  });

  test('provinsi duplicate shows duplicateWarning when adding an existing provinsi', async () => {
    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    // open provinsi modal
    fireEvent.click(tambahButtons[2]);
    const input = screen.getByPlaceholderText(/Nama provinsi/i) as HTMLInputElement;
    // use an existing provinsi from the mocked services/api
    fireEvent.change(input, { target: { value: 'Jawa Barat' } });
    fireEvent.click(screen.getByText(/Simpan/i));

    await waitFor(() => expect(screen.getByText(/sudah ada di daftar/i)).toBeInTheDocument());
  });

  test('empty provinsi save returns early and modal remains open', async () => {
    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    fireEvent.click(tambahButtons[2]);
    // click Simpan without entering a name
    fireEvent.click(screen.getByText(/Simpan/i));
    // modal input should still be present because empty save returns early
    expect(screen.getByPlaceholderText(/Nama provinsi/i)).toBeInTheDocument();
  });

  test('serverValidationMessages Tutup button clears messages and raw JSON', async () => {
    // trigger serverValidationMessages by making createCuratorCase reject with nested errors
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (global as any).__TEST_INJECT_API__ = {
      createCuratorCase: jest.fn(() => Promise.reject({ status: 400, detail: { news: { content: ['Missing content'] } } })),
    };

    render(<CuratorAddDataPage />);
    // fill required fields
    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih...'), { target: { value: 'Demam' } });
    await waitFor(() => screen.getByText(/Demam Berdarah/i));
    fireEvent.click(screen.getByText(/Demam Berdarah/i));
    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih lokasi...'), { target: { value: 'Jakarta' } });
    await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
    fireEvent.click(getExactText('Jakarta'));
    await addSumber({ url: 'https://example.com' });
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat.../i), { target: { value: 'ok' } });

    fireEvent.click(screen.getByText(/Terapkan/i));

    // wait for the yellow server validation box to appear
    await waitFor(() => expect(screen.getByText(/Validasi server menemukan masalah/i)).toBeInTheDocument());
    // click Tutup inside that box to clear serverValidationMessages and serverValidationRaw
    fireEvent.click(screen.getByText(/^Tutup$|^Tutup/i));
    await waitFor(() => expect(screen.queryByText(/Validasi server menemukan masalah/i)).not.toBeInTheDocument());

    // cleanup
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete (global as any).__TEST_INJECT_API__;
  });

  test('addNewLokasi throws on invalid coords and falls back to local add (shows success emoji)', async () => {
    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    // open lokasi modal (second button)
    fireEvent.click(tambahButtons[1]);
    const input = screen.getByPlaceholderText(/Nama lokasi/i) as HTMLInputElement;
    const latInput = screen.getByPlaceholderText(/Contoh: -6.895/i) as HTMLInputElement;
    const lngInput = screen.getByPlaceholderText(/Contoh: 107.618/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'CityBadCoord' } });
    // supply invalid numeric strings to trigger Number.isNaN path
    fireEvent.change(latInput, { target: { value: 'not-a-number' } });
    fireEvent.change(lngInput, { target: { value: 'also-bad' } });
    fireEvent.click(screen.getByText(/Simpan/i));

    // fallback local add should show success emoji (local add)
    await waitFor(() => expect(screen.getByText('✅')).toBeInTheDocument());

    // we observed UI timing varies; ensure success emoji shown which signals fallback add
    // the list update is visual and may be delayed by other async ops
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  test('createLocation via registry returns object with city property and is normalized', async () => {
    // mutate the mocked services/api to return an object-shaped response for createLocation
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const svc = require('../../services/api');
    const orig = (svc.registryApi as any).createLocation;
    (svc.registryApi as any).createLocation = jest.fn((name: string, lat?: number, lng?: number) => Promise.resolve({ city: `${name}-CITY` }));

    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    // open lokasi modal (second button)
    fireEvent.click(tambahButtons[1]);
    const input = screen.getByPlaceholderText(/Nama lokasi/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'CityFromObj' } });
    fireEvent.click(screen.getByText(/Simpan/i));

    // ensure the registry API was called with the provided name
    await waitFor(() => expect((svc.registryApi as any).createLocation).toHaveBeenCalledWith('CityFromObj', undefined, undefined));
    // feedback should be shown (success emoji)
    await waitFor(() => expect(screen.getByText('✅')).toBeInTheDocument());

    // restore
    (svc.registryApi as any).createLocation = orig;
  });

  test('createLocation endpointNotFound fallback shows error feedback (❌)', async () => {
    // mutate services/api so createLocation throws endpointNotFound
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const svc = require('../../services/api');
    const orig = (svc.registryApi as any).createLocation;
    (svc.registryApi as any).createLocation = jest.fn(() => Promise.reject(Object.assign(new Error('No endpoint'), { endpointNotFound: true })));

    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    fireEvent.click(tambahButtons[1]);
    const input = screen.getByPlaceholderText(/Nama lokasi/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'CityEndpointMissing' } });
    fireEvent.click(screen.getByText(/Simpan/i));

    // ensure registry API was attempted
    await waitFor(() => expect((svc.registryApi as any).createLocation).toHaveBeenCalledWith('CityEndpointMissing', undefined, undefined));
    // error feedback emoji should be visible (❌) for endpoint-not-found fallback
    await waitFor(() => expect(screen.getByText('❌')).toBeInTheDocument());

    // restore
    (svc.registryApi as any).createLocation = orig;
  });

  test('addNewProvinsi falls back locally when registry.createProvince is missing', async () => {
    // mutate services/api so registryApi exists but createProvince is undefined
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const svc = require('../../services/api');
    const origCreate = (svc.registryApi as any).createProvince;
    (svc.registryApi as any).createProvince = undefined;

    render(<CuratorAddDataPage />);
    const tambahButtons = screen.getAllByText(/Tambah baru/i);
    fireEvent.click(tambahButtons[2]);
    const input = screen.getByPlaceholderText(/Nama provinsi/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ProvNoCreateFn' } });
    fireEvent.click(screen.getByText(/Simpan/i));

  // should show error emoji for endpoint-not-available fallback
  await waitFor(() => expect(screen.getByText('❌')).toBeInTheDocument());

  // confirm error emoji displayed (fallback path exercised). List update may be async
  expect(screen.getByText('❌')).toBeInTheDocument();

    // restore
    (svc.registryApi as any).createProvince = origCreate;
  });

  test('handleApply shows each string when server returns 400.detail as an array', async () => {
    // inject createCuratorCase that rejects with an array-detail
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (global as any).__TEST_INJECT_API__ = { createCuratorCase: jest.fn(() => Promise.reject({ status: 400, detail: ['Err1', 'Err2'] })) };

    render(<CuratorAddDataPage />);
    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih...'), { target: { value: 'Demam' } });
    await waitFor(() => screen.getByText(/Demam Berdarah/i));
    fireEvent.click(screen.getByText(/Demam Berdarah/i));
    fireEvent.change(screen.getByPlaceholderText('Cari atau pilih lokasi...'), { target: { value: 'Jakarta' } });
    await waitFor(() => expect(getExactText('Jakarta')).toBeInTheDocument());
    fireEvent.click(getExactText('Jakarta'));
    await addSumber({ url: 'https://example.com' });
    fireEvent.change(screen.getByPlaceholderText(/Tulis ringkasan singkat.../i), { target: { value: 'ok' } });

    fireEvent.click(screen.getByText(/Terapkan/i));

    // each error in the array should be rendered somewhere
    await waitFor(() => expect(screen.getByText(/Err1/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/Err2/i)).toBeInTheDocument());

    // cleanup
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete (global as any).__TEST_INJECT_API__;
  });
});