const fs = require('fs');

const path = 'src/components/BookReader.tsx';
let content = fs.readFileSync(path, 'utf8');

const styleBlock = `
        <style>{\`
          .glow-btn-group {
            position: relative;
            display: inline-block;
            height: 48px;
            pointer-events: auto;
            transition: all 0.2s ease;
            border: none;
            background: transparent;
            padding: 0;
            cursor: pointer;
            outline: none;
          }
          .glow-btn-group:hover {
            transform: scale(1.03);
          }
          .glow-btn-group:active {
            transform: scale(0.97);
          }
          .glow-bg {
            position: absolute;
            inset: -2px;
            border-radius: 10px;
            background: linear-gradient(to right, #6366f1, #a855f7);
            opacity: 0.25;
            filter: blur(6px);
            transition: opacity 0.2s ease;
            z-index: 0;
            pointer-events: none;
          }
          .glow-btn-group:hover .glow-bg {
            opacity: 1;
          }
          .glow-btn-group:hover .glow-btn-content {
            background: linear-gradient(
              135deg,
              rgba(49, 46, 129, 0.48) 0%,
              rgba(67, 56, 202, 0.32) 100%
            );
            border-color: rgba(129, 140, 248, 0.68);
          }
          .glow-btn-content {
            position: relative;
            z-index: 1;
            display: flex;
            height: 100%;
            box-sizing: border-box;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border-radius: 8px;
            border: 1px solid rgba(129, 140, 248, 0.55);
            background: linear-gradient(
              135deg,
              rgba(49, 46, 129, 0.42) 0%,
              rgba(67, 56, 202, 0.28) 100%
            );
            backdrop-filter: blur(10px) saturate(135%);
            -webkit-backdrop-filter: blur(10px) saturate(135%);
            padding: 0 20px;
            color: #f7fafc;
            font-weight: 600;
            font-size: 14px;
            font-family: "Cinzel", "Times New Roman", serif;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.2),
              0 8px 24px rgba(15, 23, 42, 0.28);
            transition: all 0.2s ease;
          }
          .glow-btn-group.transcribe-btn-new .glow-btn-content,
          .glow-btn-group.detect-btn-new .glow-btn-content {
            text-transform: none;
            letter-spacing: normal;
          }
          .glow-btn-group.transcribe-btn-new .glow-bg {
            background: linear-gradient(to right, #2563eb, #0891b2);
            opacity: 0.6;
          }
          .glow-btn-group.transcribe-btn-new:hover .glow-btn-content {
            background: linear-gradient(135deg, rgba(37, 99, 235, 0.85) 0%, rgba(8, 145, 178, 0.7) 100%);
            border-color: rgba(96, 165, 250, 0.9);
          }
          .glow-btn-group.transcribe-btn-new .glow-btn-content {
            background: linear-gradient(135deg, rgba(37, 99, 235, 0.75) 0%, rgba(8, 145, 178, 0.6) 100%);
            border-color: rgba(59, 130, 246, 0.8);
          }

          .glow-btn-group.detect-btn-new .glow-bg {
            background: linear-gradient(to right, #059669, #047857);
            opacity: 0.6;
          }
          .glow-btn-group.detect-btn-new:hover .glow-btn-content {
            background: linear-gradient(135deg, rgba(5, 150, 105, 0.85) 0%, rgba(4, 120, 87, 0.7) 100%);
            border-color: rgba(52, 211, 153, 0.9);
          }
          .glow-btn-group.detect-btn-new .glow-btn-content {
            background: linear-gradient(135deg, rgba(5, 150, 105, 0.75) 0%, rgba(4, 120, 87, 0.6) 100%);
            border-color: rgba(16, 185, 129, 0.8);
          }

          /* Two-Column Main Layout */
          .reader-layout {
            display: grid;
            grid-template-columns: 1fr auto 340px;
            gap: 0;
            align-items: stretch;
            transition: grid-template-columns 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .reader-layout.resizing {
            transition: none;
          }
          @media (max-width: 1100px) {
            .reader-layout {
              grid-template-columns: 1fr !important;
            }
            .resizer-bar {
              display: none;
            }
            .side-results-panel {
              height: auto !important;
              max-height: 500px;
              width: 100% !important;
            }
          }

          /* Resizer Styling */
          .resizer-bar {
            width: 16px;
            height: auto;
            cursor: col-resize;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 10;
            margin: 0 4px;
            transition: opacity 0.2s;
          }
          .resizer-line {
            width: 2px;
            height: 100%;
            background: rgba(74, 85, 104, 0.3);
            border-radius: 2px;
            transition: background 0.2s;
          }
          .resizer-bar:hover .resizer-line,
          .resizer-bar.active .resizer-line {
            background: #3b82f6;
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
          }

          /* Thumbnails Strip (Vertical) */
          .thumbnails-strip {
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: rgba(15, 23, 42, 0.6);
            border-radius: 12px;
            padding: 12px;
            border: 1px solid #4a5568;
            height: 100%;
          }

          .strip-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(74, 85, 104, 0.5);
            padding-bottom: 8px;
            margin-bottom: 4px;
          }
          .strip-header h3 {
            margin: 0;
            font-size: 0.9rem;
            color: #e2e8f0;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .page-nav-container {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.85rem;
            color: #a0aec0;
          }
          .page-nav-form {
            margin: 0;
          }
          .page-nav-input {
            width: 36px;
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid #4a5568;
            color: #f8fafc;
            border-radius: 4px;
            padding: 2px 4px;
            text-align: center;
            font-size: 0.85rem;
            outline: none;
          }
          .page-nav-input:focus {
            border-color: #3b82f6;
          }

          .thumbnails-row {
            display: flex;
            flex-direction: row;
            overflow-x: auto;
            gap: 12px;
            padding-bottom: 8px;
            /* Hide scrollbar for cleaner look, optional */
            scrollbar-width: thin;
            scrollbar-color: #4a5568 transparent;
          }
          
          .thumbnails-row::-webkit-scrollbar {
            height: 6px;
          }
          .thumbnails-row::-webkit-scrollbar-track {
            background: transparent;
          }
          .thumbnails-row::-webkit-scrollbar-thumb {
            background-color: #4a5568;
            border-radius: 10px;
          }

          .strip-thumb-btn {
            flex: 0 0 auto;
            width: 80px;
            height: 110px;
            background: #1e293b;
            border: 2px solid transparent;
            border-radius: 6px;
            overflow: hidden;
            cursor: pointer;
            padding: 0;
            position: relative;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .strip-thumb-btn img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
          .strip-thumb-btn.selected {
            border-color: #3b82f6;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
            transform: scale(1.05);
          }
          .strip-thumb-btn:hover:not(.selected) {
            border-color: #64748b;
            transform: translateY(-2px);
          }

          .thumb-label {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(15, 23, 42, 0.8);
            color: white;
            font-size: 0.6rem;
            font-weight: 700;
            padding: 2px 0;
            text-align: center;
          }

          .side-results-panel {
            height: 0;
            min-height: 100%;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            min-width: 0;
          }
          .side-results-container {
            flex: 1;
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid #4a5568;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          }

          /* Processing Effects */
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes breathing {
            0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.2), inset 0 0 0 rgba(59, 130, 246, 0); }
            50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 10px rgba(59, 130, 246, 0.2); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .glow-btn-group.loading {
            animation: breathing 2s infinite ease-in-out;
            cursor: wait;
          }

          .glow-btn-group.loading .glow-btn-content {
            background: linear-gradient(
              90deg,
              rgba(15, 23, 42, 0.9) 0%,
              rgba(30, 41, 59, 0.95) 50%,
              rgba(15, 23, 42, 0.9) 100%
            ) !important;
            background-size: 200% 100% !important;
            animation: shimmer 1.5s infinite linear !important;
            border-color: #3b82f6 !important;
            color: #60a5fa !important;
          }

          .loading-spinner {
            width: 14px;
            height: 14px;
            border: 2px solid rgba(96, 165, 250, 0.2);
            border-top-color: #60a5fa;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            display: inline-block;
          }
        \`}</style>
`;

content = content.replace(
  '<div className="book-reader-wrapper" style={{ display: \'flex\', flexDirection: \'column\', gap: \'1.5rem\', width: \'100%\', padding: \'0.5rem 0\' }}>',
  '<div className="book-reader-wrapper" style={{ display: \'flex\', flexDirection: \'column\', gap: \'1.5rem\', width: \'100%\', padding: \'0.5rem 0\' }}>\n' + styleBlock
);

fs.writeFileSync(path, content);
