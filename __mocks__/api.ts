export const mapApi = {
    getDashboardData: jest.fn(() =>
      Promise.resolve({
        severity_statistics: {
          total_cases: 100,
          severity_counts: {
            Mortalitas: 10,
            Insiden: 80,
            Hospitalisasi: 10,
          },
        },
        prevalence_statistics: {
          prevalence: 0.07315,
          year: 2024,
          population: 279390258,
        },
        gender_statistics: {
          male: 50,
          female: 50,
        },
        severity_dates_count_statistics: {
          "Tingkat 1": [
            { date: "2024-01", count: 10 },
            { date: "2024-02", count: 15 },
          ],
          "Tingkat 2": [
            { date: "2024-01", count: 5 },
            { date: "2024-02", count: 8 },
          ],
        },
      })
    ),
  };