import FileList from '../FileList';

const mockFiles = [
  {
    id: '1',
    name: 'consent-11-08-2025.webm',
    type: 'audio' as const,
    date: 'Nov 8, 2025',
    duration: '2:34',
  },
  {
    id: '2',
    name: 'consent-contract-11-07-2025.pdf',
    type: 'contract' as const,
    date: 'Nov 7, 2025',
  },
  {
    id: '3',
    name: 'consent-11-05-2025.webm',
    type: 'audio' as const,
    date: 'Nov 5, 2025',
    duration: '1:45',
  },
];

export default function FileListExample() {
  const handleDownload = (id: string) => {
    console.log('Download file:', id);
  };

  const handleDelete = (id: string) => {
    console.log('Delete file:', id);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <FileList files={mockFiles} onDownload={handleDownload} onDelete={handleDelete} />
    </div>
  );
}
