import { useState } from 'react';
import UniversitySelector from '../UniversitySelector';

const mockUniversities = [
  { id: '1', name: 'Harvard University', state: 'Massachusetts' },
  { id: '2', name: 'Stanford University', state: 'California' },
  { id: '3', name: 'Yale University', state: 'Connecticut' },
  { id: '4', name: 'Princeton University', state: 'New Jersey' },
  { id: '5', name: 'Columbia University', state: 'New York' },
];

export default function UniversitySelectorExample() {
  const [selected, setSelected] = useState(mockUniversities[0]);
  
  return (
    <div className="p-4 max-w-md mx-auto">
      <UniversitySelector
        universities={mockUniversities}
        selectedUniversity={selected}
        onSelect={setSelected}
      />
    </div>
  );
}
