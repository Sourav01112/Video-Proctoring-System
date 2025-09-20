// Safe jsPDF wrapper
export class PDFService {
  private static _jsPDF: any = null;
  
  // Public initialization method
  static init() {
    this.initialize();
  }
  
  static createDocument(options: any = {}) {
    this.initialize();
    
    if (!this._jsPDF) {
      throw new Error('jsPDF is not available. Please check CDN loading.');
    }
    
    const config = {
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      ...options
    };
    
    return new this._jsPDF(config);
  }
  
  static isAvailable(): boolean {
    this.initialize();
    return !!this._jsPDF;
  }
  
  static get jsPDF() {
    this.initialize();
    return this._jsPDF;
  }
  
  // Private internal method
  private static initialize() {
    if (typeof window !== 'undefined' && !this._jsPDF) {
      // Try to get jsPDF from window (CDN)
      if (window.jspdf?.jsPDF) {
        this._jsPDF = window.jspdf.jsPDF;
        console.log('PDFService: jsPDF loaded from CDN');
      } else {
        console.warn('PDFService: jsPDF not found on window');
      }
    }
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  const initPDFService = () => {
    PDFService.init();
  };

  // Initialize immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPDFService);
  } else {
    initPDFService();
  }

  // Also try to initialize after a short delay in case CDN is still loading
  setTimeout(initPDFService, 100);
}