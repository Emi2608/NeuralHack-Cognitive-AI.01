import React, { useState } from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel, IonCheckbox, IonSpinner } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import './ExportPanel.css';

interface ExportPanelProps {
  assessmentData: any;
  onExport?: (format: string) => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ assessmentData, onExport }) => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState({
    pdf: true,
    csv: false,
    json: false
  });

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      doc.text('NeuralHack Cognitive Assessment Report', 20, 20);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);
      
      // Add assessment results
      let yPosition = 60;
      Object.entries(assessmentData).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 20, yPosition);
        yPosition += 20;
      });

      doc.save('cognitive-assessment-report.pdf');
      onExport?.('pdf');
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const csvContent = Object.entries(assessmentData)
        .map(([key, value]) => `${key},${value}`)
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, 'cognitive-assessment-data.csv');
      onExport?.('csv');
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const jsonContent = JSON.stringify(assessmentData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      saveAs(blob, 'cognitive-assessment-data.json');
      onExport?.('json');
    } catch (error) {
      console.error('Error exporting JSON:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <IonCard className="export-panel">
      <IonCardHeader>
        <IonCardTitle>{t('export.title')}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="export-options">
          <IonItem>
            <IonCheckbox
              checked={selectedFormats.pdf}
              onIonChange={(e) => setSelectedFormats(prev => ({ ...prev, pdf: e.detail.checked }))}
            />
            <IonLabel className="ion-margin-start">PDF Report</IonLabel>
          </IonItem>
          
          <IonItem>
            <IonCheckbox
              checked={selectedFormats.csv}
              onIonChange={(e) => setSelectedFormats(prev => ({ ...prev, csv: e.detail.checked }))}
            />
            <IonLabel className="ion-margin-start">CSV Data</IonLabel>
          </IonItem>
          
          <IonItem>
            <IonCheckbox
              checked={selectedFormats.json}
              onIonChange={(e) => setSelectedFormats(prev => ({ ...prev, json: e.detail.checked }))}
            />
            <IonLabel className="ion-margin-start">JSON Data</IonLabel>
          </IonItem>
        </div>

        <div className="export-actions">
          {selectedFormats.pdf && (
            <IonButton 
              expand="block" 
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              {isExporting ? <IonSpinner /> : t('export.pdf')}
            </IonButton>
          )}
          
          {selectedFormats.csv && (
            <IonButton 
              expand="block" 
              onClick={handleExportCSV}
              disabled={isExporting}
            >
              {isExporting ? <IonSpinner /> : t('export.csv')}
            </IonButton>
          )}
          
          {selectedFormats.json && (
            <IonButton 
              expand="block" 
              onClick={handleExportJSON}
              disabled={isExporting}
            >
              {isExporting ? <IonSpinner /> : t('export.json')}
            </IonButton>
          )}
        </div>
      </IonCardContent>
    </IonCard>
  );
};