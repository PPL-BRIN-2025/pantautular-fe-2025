import React from 'react';
import { render, screen } from '@testing-library/react';
import { DiseaseSeverityChart } from '../../app/components/severity/DeseaseSeverity';

// Mock amCharts modules
jest.mock('@amcharts/amcharts5', () => ({
  Root: { new: jest.fn() },
  color: jest.fn(),
  Tooltip: { new: jest.fn() },
  RoundedRectangle: { new: jest.fn() }
}));

jest.mock('@amcharts/amcharts5/xy', () => ({
  XYChart: { new: jest.fn() },
  CategoryAxis: { new: jest.fn() },
  ValueAxis: { new: jest.fn() },
  ColumnSeries: { new: jest.fn() }
}));

// Mock the diseaseApi
jest.mock('../../services/api', () => ({
  diseaseApi: {
    getSeverityStats: jest.fn().mockResolvedValue([])
  }
}));

describe('DiseaseSeverityChart', () => {
  it('renders chart title', () => {
    render(<DiseaseSeverityChart />);
    expect(screen.getByText('Kasus Jenis Penyakit')).toBeInTheDocument();
  });
}); 