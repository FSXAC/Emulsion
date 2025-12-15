import React, { useState } from 'react';

// Import all components we'll showcase
import AddChemistryForm from '../components/AddChemistryForm';
import AddRollForm from '../components/AddRollForm';
import ActiveFilters from '../components/ActiveFilters';
import AutocompleteInput from '../components/AutocompleteInput';
import CanisterPreview from '../components/CanisterPreview';
import ChemistryPickerModal from '../components/ChemistryPickerModal';
import DatePickerModal from '../components/DatePickerModal';
import EditChemistryForm from '../components/EditChemistryForm';
import EditRollForm from '../components/EditRollForm';
import ErrorMessage from '../components/ErrorMessage';
import FilmRollCard from '../components/FilmRollCard';
import Icon from '../components/Icon';
import LoadingSpinner from '../components/LoadingSpinner';
import RatingModal from '../components/RatingModal';
import SearchBar from '../components/SearchBar';
import SearchHelpModal from '../components/SearchHelpModal';
import SpoolUpModal from '../components/SpoolUpModal';
import StatCard from '../components/StatCard';
import StatusColumn from '../components/StatusColumn';
import { iconMap } from '../components/Icon';

export default function DesignSystem() {
  // Modal state management
  const [openModal, setOpenModal] = useState(null);

  // Filter state management
  const [activeFilters, setActiveFilters] = useState([
    { field: 'status', operator: ':', value: 'loaded' },
    { field: 'film_stock', operator: ':', value: 'Kodak Portra 400' },
    { field: 'stars', operator: '>=', value: '4' },
    { value: 'last month' }
  ]);

  // Mock data for examples - comprehensive variations
  const mockRolls = [
    {
      id: 1,
      film_stock_name: 'Kodak Portra 400',
      film_format: '35mm',
      expected_exposures: 36,
      actual_exposures: 36,
      date_loaded: null,
      date_unloaded: null,
      push_pull_stops: null,
      chemistry_name: null,
      stars: 0,
      film_cost: null,
      dev_cost: null,
      notes: 'Fresh roll, needs to be loaded',
      not_mine: true,
      order_id: "ORD123456"
    },
    {
      id: 2,
      film_stock_name: 'Ilford HP5 Plus',
      film_format: '120',
      expected_exposures: 16,
      actual_exposures: 16,
      date_loaded: '2024-10-15',
      date_unloaded: '2024-10-25',
      duration_days: 10,
      push_pull_stops: 1,
      chemistry_name: 'Rodinal 1:25',
      stars: 4,
      film_cost: 18.99,
      dev_cost: 8.50,
      notes: 'Great contrast, slight push worked well'
    },
    {
      id: 3,
      film_stock_name: 'Fuji Superia X-tra 400',
      film_format: '35mm',
      expected_exposures: 36,
      actual_exposures: 24,
      date_loaded: '2024-11-01',
      date_unloaded: null,
      chemistry_name: 'HC-110 Dilution B',
      stars: 0,
      film_cost: 7.99,
      dev_cost: null,
      notes: null
    },
    {
      id: 4,
      film_stock_name: 'Kodak T-Max 400',
      film_format: '35mm',
      expected_exposures: 36,
      actual_exposures: null,
      date_loaded: '2024-11-10',
      date_unloaded: null,
      push_pull_stops: -0.5,
      chemistry_name: 'XTOL 1:3',
      stars: 5,
      film_cost: 14.49,
      dev_cost: 6.20,
      not_mine: true,
      notes: 'Friend\'s roll, processed in XTOL'
    },
    {
      id: 5,
      film_stock_name: 'Ilford Delta 100',
      film_format: '35mm',
      expected_exposures: 36,
      actual_exposures: 36,
      date_loaded: '2024-09-01',
      date_unloaded: '2024-09-20',
      duration_days: 19,
      push_pull_stops: 0,
      chemistry_name: 'Perceptol',
      stars: 3,
      film_cost: 16.99,
      dev_cost: 4.50,
      notes: null
    }
  ];

  const mockChemistry = {
    id: 1,
    name: 'HC-110 Dilution B',
    type: 'Developer',
    dilution: '1:31',
    process: 'C-41',
    duration_seconds: 420,
    temperature_celsius: 38,
    quantity_ml: 500,
    cost: 15.50,
    notes: 'Sample chemistry',
    batch_count: 1
  };

  const mockStats = [
    {
      title: 'Total Film Rolls',
      value: '42',
      icon: 'film',
      color: 'medium',
      subtitle: 'Active rolls'
    },
    {
      title: 'Total Spent',
      value: '$489.23',
      icon: 'dollar',
      color: 'strong',
      subtitle: 'All time'
    },
    {
      title: 'Developed This Month',
      value: '8',
      icon: 'chemistry',
      color: 'light'
    },
    {
      title: 'Average Rating',
      value: '4.2',
      icon: 'star',
      color: 'medium',
      subtitle: 'Star rating'
    }
  ];

  // Handlers
  const openModalHandler = (modalName) => setOpenModal(modalName);
  const closeModal = () => setOpenModal(null);

  const handleFormSubmit = (data) => {
    console.log('Form submitted:', data);
    closeModal();
  };

  const handleRemoveFilter = (index) => {
    setActiveFilters(activeFilters.filter((_, i) => i !== index));
  };

  const handleClearAllFilters = () => {
    setActiveFilters([]);
  };

  // Sections
  const renderButtons = () => (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Buttons</h2>
      <div className="flex flex-wrap gap-8 items-center">
        <button className="relative bg-film-orange-600 hover:bg-film-orange-700 text-white px-6 py-3 rounded-3xl font-semibold transition-all duration-200
                         shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]">
          Primary Button
        </button>
        <button className="relative bg-film-orange-100 border-film-orange-500 hover:bg-gray-50 rounded-3xl hover:border-film-orange-600 text-gray-700 px-6 py-3 font-medium transition-all duration-200
                         shadow-[0_3px_5px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_4px_6px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
          Secondary Button
        </button>
        <button className="relative bg-transparent text-film-orange-600 hover:bg-film-orange-50 px-6 py-3 rounded-md font-medium transition-all duration-200
                         shadow-[0_2px_4px_rgba(255,102,0,0.15),inset_0_1px_0_rgba(255,255,255,0.8)] hover:shadow-[0_4px_6px_rgba(255,102,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] hover:scale-105">
          Ghost Button
        </button>
        <button className="relative hover:bg-gray-100 p-3 rounded-md transition-all duration-200
                         shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] hover:shadow-[0_3px_5px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.9)] hover:scale-110">
          <Icon name="edit" size={20} />
        </button>
        <button className="relative bg-film-orange-600 text-white p-3 rounded-full hover:bg-film-orange-700 transition-all duration-200 hover:scale-110 active:scale-95
                         shadow-[0_3px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_4px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]">
          <Icon name="check" size={20} />
        </button>
      </div>
    </section>
  );

  const renderInputs = () => (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Inputs & Labels</h2>
      <div className="space-y-4 max-w-md">
        <div>
          <label htmlFor="sample-input" className="block text-sm font-medium text-gray-700 mb-2">
            Sample Label
          </label>
          <input
            id="sample-input"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-film-orange-500 focus:border-transparent"
            placeholder="Type here..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Textarea</label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-film-orange-500 focus:border-transparent"
            placeholder="Multi-line text..."
          />
        </div>
        <div className="flex items-center">
          <input id="checkbox" type="checkbox" className="rounded text-film-orange-600" />
          <label htmlFor="checkbox" className="ml-2 text-sm text-gray-700">Checkbox label</label>
        </div>
        <div>
          <AutocompleteInput
            placeholder="Search films..."
            suggestions={['Kodak Portra 400', 'Fuji Superia', 'Ilford HP5']}
          />
        </div>
      </div>
    </section>
  );

  const renderCards = () => (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Cards</h2>
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Film Roll Cards - Different States</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRolls.slice(0, 3).map((roll, index) => (
            <FilmRollCard
              key={roll.id}
              roll={roll}
              onClick={() => console.log(`Film card ${index + 1} clicked`)}
            />
          ))}
        </div>
        <h3 className="text-lg font-semibold">Stat Cards - Different Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mockStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
        <h3 className="text-lg font-semibold">Generic Card</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <h3 className="text-lg font-semibold mb-2">Standard Card</h3>
            <p className="text-gray-600">This is a sample card with standard styling.</p>
          </div>
          <div className="bg-white border-2 border-film-orange-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all bg-film-orange-50">
            <h3 className="text-lg font-semibold mb-2 text-film-orange-700">Highlighted Card</h3>
            <p className="text-gray-700">Cards can have different emphasis levels.</p>
          </div>
        </div>
      </div>
    </section>
  );

  const renderModals = () => (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Modals</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => openModalHandler('add-roll')} className="bg-film-orange-600 text-white px-4 py-2 rounded-md font-medium hover:bg-film-orange-700">
          Add Roll Modal
        </button>
        <button onClick={() => openModalHandler('add-chemistry')} className="bg-film-orange-600 text-white px-4 py-2 rounded-md font-medium hover:bg-film-orange-700">
          Add Chemistry Modal
        </button>
        <button onClick={() => openModalHandler('chemistry-picker')} className="bg-film-orange-600 text-white px-4 py-2 rounded-md font-medium hover:bg-film-orange-700">
          Chemistry Picker
        </button>
        <button onClick={() => openModalHandler('date-picker')} className="bg-film-orange-600 text-white px-4 py-2 rounded-md font-medium hover:bg-film-orange-700">
          Date Picker
        </button>
        <button onClick={() => openModalHandler('rating')} className="bg-film-orange-600 text-white px-4 py-2 rounded-md font-medium hover:bg-film-orange-700">
          Rating Modal
        </button>
        <button onClick={() => openModalHandler('search-help')} className="bg-film-orange-600 text-white px-4 py-2 rounded-md font-medium hover:bg-film-orange-700">
          Search Help
        </button>
        <button onClick={() => openModalHandler('spool-up')} className="bg-film-orange-600 text-white px-4 py-2 rounded-md font-medium hover:bg-film-orange-700">
          Spool Up
        </button>
        <button onClick={() => openModalHandler('edit-roll')} className="bg-film-orange-600 text-white px-4 py-2 rounded-md font-medium hover:bg-film-orange-700">
          Edit Roll
        </button>
      </div>

      {/* Modal instances */}
      <AddRollForm
        isOpen={openModal === 'add-roll'}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
      />
      <AddChemistryForm
        isOpen={openModal === 'add-chemistry'}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
      />
      <ChemistryPickerModal
        isOpen={openModal === 'chemistry-picker'}
        onClose={closeModal}
        onConfirm={(chem) => console.log('Selected chemistry:', chem)}
        roll={mockRolls[0]}
      />
      <DatePickerModal
        isOpen={openModal === 'date-picker'}
        onClose={closeModal}
        onConfirm={(date) => console.log('Selected date:', date)}
        title="Select Date"
      />
      <RatingModal
        isOpen={openModal === 'rating'}
        onClose={closeModal}
        onConfirm={(rating) => console.log('Rating:', rating)}
        roll={mockRolls[0]}
      />
      <SearchHelpModal
        isOpen={openModal === 'search-help'}
        onClose={closeModal}
      />
      <SpoolUpModal
        isOpen={openModal === 'spool-up'}
        onClose={closeModal}
        onConfirm={(config) => console.log('Spool up config:', config)}
        bulkRoll={mockRolls[0]}
      />
      <EditRollForm
        isOpen={openModal === 'edit-roll'}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        roll={mockRolls[0]}
      />
    </section>
  );

  const renderIcons = () => (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Icons</h2>
      <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4">
        {Object.entries(iconMap).map(([name, Component]) => (
          <div key={name} className="flex flex-col items-center">
            <Component size={32} className="text-gray-600" />
            <span className="text-xs text-gray-500 mt-1">{name}</span>
          </div>
        ))}
      </div>
    </section>
  );

  const renderOtherComponents = () => (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Other Components</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Loading Spinner</h3>
          <LoadingSpinner size="md" text="Loading..." />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Error Message</h3>
          <ErrorMessage title="Something went wrong" message="Please try again" onRetry={() => console.log('Retry')} />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Search Bar & Active Filters</h3>
          <SearchBar onSearch={(query) => console.log('Search:', query)} />
          <div className="mt-4">
            <ActiveFilters
              filters={activeFilters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearAllFilters}
            />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Canister Preview</h3>
          <CanisterPreview onGenerate={(config) => console.log('Generate:', config)} />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Status Column</h3>
          <StatusColumn
            status={{ name: 'Loaded', value: 'loaded' }}
            rolls={[mockRolls[0]]}
            totalCount={1}
            hasMore={false}
            displayName="Loaded Rolls"
            icon="film"
          />
        </div>
      </div>
    </section>
  );

  const renderTypography = () => (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Typography</h2>
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Display / H1 Heading</h1>
        <h2 className="text-3xl font-semibold">H2 Heading</h2>
        <h3 className="text-2xl font-semibold">H3 Heading</h3>
        <h4 className="text-xl font-medium">H4 Heading</h4>
        <p className="text-base">Body text - This is regular paragraph text with standard line height.</p>
        <p className="text-sm text-gray-700">Body small - Smaller text for additional details or captions.</p>
        <p className="text-xs text-gray-600">Caption - Even smaller text for metadata or fine print.</p>
      </div>
    </section>
  );

  const renderColors = () => (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Colors</h2>
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Base Colors</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-film-orange-600 text-white p-4 rounded-lg shadow-sm">
            film-orange - #FF6600
          </div>
          <div className="text-fg bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
            fg - #2d2d2d
          </div>
          <div className="bg-bg text-fg border border-gray-200 p-4 rounded-lg shadow-sm">
            bg - #F8F7F5
          </div>
        </div>
        <h3 className="text-lg font-semibold">Derived Colors (film-orange variations)</h3>
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-film-orange-50 text-fg border border-gray-200 p-4 rounded-lg shadow-sm">
            film-orange-50
          </div>
          <div className="bg-film-orange-100 text-fg border border-gray-200 p-4 rounded-lg shadow-sm">
            film-orange-100
          </div>
          <div className="bg-film-orange-200 text-fg border border-gray-200 p-4 rounded-lg shadow-sm">
            film-orange-200
          </div>
          <div className="bg-film-orange-300 text-fg border border-gray-200 p-4 rounded-lg shadow-sm">
            film-orange-300
          </div>
          <div className="bg-film-orange-400 text-film-orange-900 border border-gray-200 p-4 rounded-lg shadow-sm">
            film-orange-400
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-film-orange-500 text-white border border-gray-200 p-4 rounded-lg shadow-sm">
            film-orange-500
          </div>
          <div className="bg-film-orange-600 text-white border border-gray-200 p-4 rounded-lg shadow-sm">
            film-orange-600
          </div>
          <div className="bg-film-orange-700 text-white border border-gray-200 p-4 rounded-lg shadow-sm">
            film-orange-700
          </div>
          <div className="bg-film-orange-800 text-white border border-gray-200 p-4 rounded-lg shadow-sm">
            film-orange-800
          </div>
          <div className="bg-film-orange-900 text-white border border-gray-200 p-4 rounded-lg shadow-sm">
            film-orange-900
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Design System</h1>
      {renderColors()}
      {renderTypography()}
      {renderButtons()}
      {renderInputs()}
      {renderCards()}
      {renderModals()}
      {renderIcons()}
      {renderOtherComponents()}
    </div>
  );
}
