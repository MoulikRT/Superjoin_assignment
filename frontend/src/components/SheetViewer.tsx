import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CellData {
  row_num: number;
  col_name: string;
  cell_value: string;
  last_modified_by?: string;
  updated_at?: string;
}

interface Props {
  sheetId: string | null;
  refreshKey: number;
}

const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const DEFAULT_ROWS = 15;

export default function SheetViewer({ sheetId, refreshKey }: Props) {
  if (!sheetId) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-800">
        <div className="text-gray-400 text-center">
          <p className="text-lg mb-2">📊 Loading Google Sheet...</p>
          <p className="text-sm text-gray-500">
            Make sure GOOGLE_SHEET_ID is set in backend .env
          </p>
        </div>
      </div>
    );
  }

  const [cells, setCells] = useState<CellData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.post(`${API_URL}/api/sql/execute`, {
        query: 'SELECT row_num, col_name, cell_value, last_modified_by, updated_at FROM users ORDER BY row_num, col_name',
      });
      if (response.data.success) {
        setCells(response.data.data || []);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  }, []);

  // Fetch on mount and refresh key change
  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // Auto-refresh every 3 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const maxRow = Math.max(DEFAULT_ROWS, ...cells.map(c => c.row_num));

  const getCellValue = (row: number, col: string): string => {
    const cell = cells.find(c => c.row_num === row && c.col_name === col);
    return cell?.cell_value || '';
  };

  const getCellMeta = (row: number, col: string): CellData | undefined => {
    return cells.find(c => c.row_num === row && c.col_name === col);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-800">
        <div className="text-gray-400 flex items-center gap-2">
          <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Toolbar */}
      <div className="px-3 py-2 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-gray-300 text-sm font-medium">📊 Database View</span>
          <span className="text-gray-500 text-xs">
            {cells.length} cell{cells.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <span className="text-gray-500 text-xs">
            Updated: {lastUpdated}
          </span>
          <button
            onClick={fetchData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto p-2">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="w-10 bg-gray-700 border border-gray-600 p-1 text-gray-400 text-xs"></th>
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className="bg-gray-700 border border-gray-600 p-1.5 text-gray-300 font-medium text-xs min-w-[100px]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxRow }, (_, i) => i + 1).map((row) => (
              <tr key={row} className="group">
                <td className="bg-gray-700 border border-gray-600 p-1 text-gray-400 text-center text-xs font-mono">
                  {row}
                </td>
                {COLUMNS.map((col) => {
                  const value = getCellValue(row, col);
                  const meta = getCellMeta(row, col);
                  const hasValue = value !== '';

                  return (
                    <td
                      key={`${row}-${col}`}
                      className={`border border-gray-700 p-1.5 min-w-[100px] transition-colors
                        ${hasValue
                          ? 'bg-gray-900 text-gray-200'
                          : 'bg-gray-850 text-gray-600 group-hover:bg-gray-800'
                        }`}
                      title={meta ? `Modified by: ${meta.last_modified_by}\nUpdated: ${meta.updated_at}` : ''}
                    >
                      <div className="flex items-center justify-between">
                        <span>{value}</span>
                        {hasValue && meta?.last_modified_by && (
                          <span className={`text-[10px] ml-1 ${
                            meta.last_modified_by === 'user' ? 'text-blue-500' :
                            meta.last_modified_by === 'sql_terminal' ? 'text-yellow-500' :
                            'text-green-500'
                          }`}>
                            {meta.last_modified_by === 'user' ? '📄' :
                             meta.last_modified_by === 'sql_terminal' ? '💻' : '🔧'}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-3 py-2 border-t border-gray-700 flex items-center gap-4 text-xs text-gray-500">
        <span>📄 From Google Sheet</span>
        <span>💻 From SQL Terminal</span>
        <span>🔧 System</span>
      </div>
    </div>
  );
}