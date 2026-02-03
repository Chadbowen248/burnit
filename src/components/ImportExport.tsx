// src/components/ImportExport.tsx
import { useRef } from "react";
import { TrackerData, Goals, Food } from "./types";

interface ExportData {
  trackerData: TrackerData;
  goals: Goals;
  favorites: Food[];
  exportDate: string;
}

interface ImportExportProps {
  trackerData: TrackerData;
  goals: Goals;
  favorites: Food[];
  onImport: (data: ExportData) => void;
  onClose: () => void;
}

const ImportExport: React.FC<ImportExportProps> = ({
  trackerData,
  goals,
  favorites,
  onImport,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const exportData: ExportData = {
      trackerData,
      goals,
      favorites,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `burnit-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ExportData;
        if (data.trackerData && data.goals) {
          if (window.confirm("This will replace all your current data. Continue?")) {
            onImport(data);
            onClose();
          }
        } else {
          alert("Invalid backup file format");
        }
      } catch {
        alert("Failed to parse backup file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Import / Export Data</h3>
        <p className="modal-description">
          Export your food log, goals, and favorites as a JSON backup file.
        </p>
        <div className="modal-buttons vertical">
          <button className="button" onClick={handleExport}>
            📥 Export Backup
          </button>
          <button
            className="button secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            📤 Import Backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: "none" }}
          />
          <button className="button secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportExport;
