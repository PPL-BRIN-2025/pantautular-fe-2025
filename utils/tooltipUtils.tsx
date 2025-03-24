import React from 'react';
import ReactDOMServer from 'react-dom/server';
import CaseDetailTooltip from '../app/components/case_detail/MapTooltip';
import { mapApi } from '../services/api';

export interface TooltipData {
  id: string;
}

export async function getTooltip(data: TooltipData): Promise<string> {
    try {
      const caseDetail = await mapApi.getCaseDetail(data.id);
      const tooltipComponent = React.createElement(CaseDetailTooltip, { 
        data: caseDetail,
        onClose: () => {
          console.log('Close requested for tooltip:', data.id);
        }
      });
      return ReactDOMServer.renderToString(tooltipComponent);
    } catch (error) {
      return '<div class="bg-white p-4">Error loading data</div>';
    }
  }