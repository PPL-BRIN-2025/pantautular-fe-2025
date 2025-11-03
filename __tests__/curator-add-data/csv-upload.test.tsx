import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// reuse existing mocks from other tests by mocking Navbar/Footer and next/navigation
jest.mock('../../app/components/Navbar', () => () => <div data-testid="mock-navbar">Navbar</div>);
jest.mock('../../app/components/Footer', () => () => <div data-testid="mock-footer">Footer</div>);
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => ({ get: (k: string) => null, toString: () => '', entries: () => [] }),
  usePathname: () => '',
  useParams: () => ({}),
}));

// default auth mock; tests will override return values
const mockUseAuth = jest.fn(() => ({ user: { role: 'CURATOR' } }));
jest.mock('../../app/auth/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));

// lightweight services/api mock to satisfy dynamic imports in the page
jest.mock('../../services/api', () => ({
  mapApi: { getProvinces: async () => [] },
  registryApi: {},
}));

import CuratorAddDataPage from '../../app/curator-add-data/page';

describe('CSV upload (add page)', () => {
  afterEach(() => {
    // cleanup fetch mock
    // @ts-ignore
    if (global.fetch && (global.fetch as any).mockReset) (global.fetch as any).mockReset();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete (global as any).__TEST_INJECT_API__;
  });

  test('blocked UI shows for non-EXP_USER (CURATOR)', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'CURATOR' } });
    render(<CuratorAddDataPage />);
    // wait for UI to render
    expect(await screen.findByText(/Unggah CSV \(Diblokir\)/i)).toBeInTheDocument();
  });

  test('EXP_USER can select and upload CSV (fetch called, filename shown)', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'EXP_USER' } });
    // mock fetch to simulate backend response
    // @ts-ignore
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ created: 3 }) }));

    render(<CuratorAddDataPage />);
    // find file input inside drop zone
    const fileInput = await screen.findByTestId('csv-file-input');
    const file = new File(['disease,gender,age,city,status,severity,location_city,location_province,news_portal,news_title,news_type,news_content,news_url,news_author,news_date_published\nX,male,30,Jakarta,confirmed,insiden,Jakarta,DKI Jakarta,Portal,Title,artikel,Content,http://x,Auth,2024-01-01'], 'cases.csv', { type: 'text/csv' });

    // fire change
    fireEvent.change(fileInput, { target: { files: [file] } });

    // wait for fetch to be called and filename to show
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(await screen.findByTestId('csv-filename')).toHaveTextContent('Terunggah: cases.csv');
  });
});