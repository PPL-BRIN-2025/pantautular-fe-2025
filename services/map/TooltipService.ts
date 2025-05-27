import * as am5 from "@amcharts/amcharts5";
import { getTooltip } from "../../utils/tooltipUtils";

/**
 * Service for handling map tooltips
 */
export class TooltipService {
  /**
   * Create a tooltip instance with proper styling
   */
  createTooltip(root: am5.Root): am5.Tooltip {
    const tooltip = am5.Tooltip.new(root, {
      getFillFromSprite: false,
      background: am5.Rectangle.new(root, {
        fill: am5.color(0xffffff),
        fillOpacity: 1,
      }),
      labelText: "",
      autoTextColor: false,
      interactive: true,
    });
    
    return tooltip;
  }

  /**
   * Setup tooltip HTML content
   */
  async setupTooltipContent(tooltip: am5.Tooltip, id: string): Promise<void> {
    try {
      const tooltipHtml = await getTooltip({ id });
      tooltip.set("html", tooltipHtml);
      
      // Set up click handler for close button
      this.setupCloseHandler(tooltip);
      
      tooltip.show();
    } catch (error) {
      console.error('Error showing tooltip:', error);
    }
  }
  
  /**
   * Setup close handler for tooltip
   */
  private setupCloseHandler(tooltip: am5.Tooltip): void {
    const closeHandler = (e: Event) => {
      const target = e.target as HTMLElement;
      console.log('clicked on', target);
      
      // Check if click is on close button
      const closeButton = target.closest('[data-tooltip-close]');
      if (closeButton) {
        e.preventDefault();
        e.stopPropagation();
        tooltip.hide();
        return;
      }

      // Check if click is outside tooltip
      const tooltipElement = document.querySelector('.am5-tooltip');
      if (tooltipElement && !tooltipElement.contains(target)) {
        console.log('clicked outside tooltip');
        e.preventDefault();
        e.stopPropagation();
        tooltip.hide();
      }
    };

    // Remove any existing event listeners
    document.removeEventListener('click', closeHandler);
    
    // Add event listener after a small delay to ensure the tooltip is rendered
    setTimeout(() => {
      document.addEventListener('click', closeHandler);
    }, 100);
  }
} 