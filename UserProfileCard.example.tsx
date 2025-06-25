/**
 * UserProfileCard Usage Examples
 * 
 * Demonstrates various use cases and configurations of the UserProfileCard component.
 * This file serves as both documentation and testing examples.
 * 
 * @author Frontend Specialist Agent
 * @version 1.0.0
 */

import React, { useState } from 'react';
import UserProfileCard, { User, UserProfileCardProps } from './UserProfileCard';

// ===== SAMPLE DATA =====

const sampleUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    title: 'Senior Frontend Developer',
    company: 'Tech Innovations Inc.',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
    bio: 'Passionate about creating accessible and performant web applications. Love working with React, TypeScript, and modern CSS.',
    location: 'San Francisco, CA',
    isOnline: true,
    socials: {
      twitter: 'https://twitter.com/sarahchen',
      linkedin: 'https://linkedin.com/in/sarahchen',
      github: 'https://github.com/sarahchen'
    }
  },
  {
    id: '2',
    name: 'Alex Rodriguez',
    email: 'alex.rodriguez@example.com',
    title: 'UX Designer',
    company: 'Design Studio Pro',
    bio: 'Designing user experiences that delight and inspire. Advocate for inclusive design practices.',
    location: 'New York, NY',
    isOnline: false,
    socials: {
      linkedin: 'https://linkedin.com/in/alexrodriguez'
    }
  },
  {
    id: '3',
    name: 'Jordan Kim',
    email: 'jordan.kim@example.com',
    title: 'Full Stack Engineer',
    isOnline: true,
  }
];

// ===== EXAMPLE COMPONENTS =====

/**
 * Basic Usage Example
 */
export const BasicExample: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Basic User Profile Card</h1>
      <div className="max-w-md">
        <UserProfileCard user={sampleUsers[0]} />
      </div>
    </div>
  );
};

/**
 * Editable Profile Example
 */
export const EditableExample: React.FC = () => {
  const [user, setUser] = useState<User>(sampleUsers[0]);
  const [isEditing, setIsEditing] = useState(false);

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    console.log('User updated:', updatedUser);
  };

  const handleEditToggle = (editing: boolean) => {
    setIsEditing(editing);
    console.log('Edit mode:', editing);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Editable Profile Card</h1>
      <p className="text-gray-600 mb-8">Click the edit button to modify the profile information.</p>
      
      <div className="max-w-md">
        <UserProfileCard
          user={user}
          editable={true}
          onUserUpdate={handleUserUpdate}
          onEditToggle={handleEditToggle}
        />
      </div>
      
      {isEditing && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Edit Mode Active:</strong> Make your changes and click "Save Changes" to persist them.
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Different Sizes Example
 */
export const SizesExample: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Profile Card Sizes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Small</h2>
          <UserProfileCard user={sampleUsers[0]} size="sm" />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Medium (Default)</h2>
          <UserProfileCard user={sampleUsers[0]} size="md" />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Large</h2>
          <UserProfileCard user={sampleUsers[0]} size="lg" />
        </div>
      </div>
    </div>
  );
};

/**
 * Loading and Error States Example
 */
export const StatesExample: React.FC = () => {
  const [showLoading, setShowLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const simulateLoading = () => {
    setShowLoading(true);
    setTimeout(() => setShowLoading(false), 3000);
  };

  const toggleError = () => {
    setShowError(!showError);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Loading and Error States</h1>
      
      <div className="space-y-8">
        <div>
          <div className="flex items-center space-x-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Loading State</h2>
            <button
              onClick={simulateLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Simulate Loading
            </button>
          </div>
          <div className="max-w-md">
            <UserProfileCard 
              user={sampleUsers[0]} 
              isLoading={showLoading}
            />
          </div>
        </div>
        
        <div>
          <div className="flex items-center space-x-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Error State</h2>
            <button
              onClick={toggleError}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              {showError ? 'Hide Error' : 'Show Error'}
            </button>
          </div>
          <div className="max-w-md">
            <UserProfileCard 
              user={sampleUsers[0]}
              error={showError ? 'Failed to load user profile. Please try again later.' : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Multiple Users Grid Example
 */
export const GridExample: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">User Profile Grid</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleUsers.map((user) => (
          <UserProfileCard
            key={user.id}
            user={user}
            showExtended={true}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Compact Version Example (without extended info)
 */
export const CompactExample: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Compact Profile Cards</h1>
      
      <div className="space-y-4">
        {sampleUsers.map((user) => (
          <UserProfileCard
            key={user.id}
            user={user}
            showExtended={false}
            size="sm"
            className="hover:bg-blue-50"
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Custom Styling Example
 */
export const CustomStylingExample: React.FC = () => {
  return (
    <div className="p-6 bg-gradient-to-br from-purple-100 to-pink-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Custom Styled Profile Card</h1>
      
      <div className="max-w-md">
        <UserProfileCard
          user={sampleUsers[0]}
          className="border-2 border-purple-300 shadow-purple-200"
          editable={true}
        />
      </div>
    </div>
  );
};

/**
 * Accessibility Testing Example
 */
export const AccessibilityExample: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Accessibility Features</h1>
      
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Accessibility Testing Instructions</h2>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Try navigating using only the Tab key</li>
          <li>• Test with a screen reader (if available)</li>
          <li>• Use the Escape key to cancel edit mode</li>
          <li>• Check color contrast ratios</li>
          <li>• Verify all interactive elements have focus indicators</li>
        </ul>
      </div>
      
      <div className="max-w-md">
        <UserProfileCard
          user={sampleUsers[0]}
          editable={true}
        />
      </div>
    </div>
  );
};

/**
 * Main demo component that showcases all examples
 */
export const UserProfileCardDemo: React.FC = () => {
  const [activeExample, setActiveExample] = useState<string>('basic');

  const examples = [
    { id: 'basic', label: 'Basic Usage', component: BasicExample },
    { id: 'editable', label: 'Editable Profile', component: EditableExample },
    { id: 'sizes', label: 'Different Sizes', component: SizesExample },
    { id: 'states', label: 'Loading & Error States', component: StatesExample },
    { id: 'grid', label: 'Multiple Users', component: GridExample },
    { id: 'compact', label: 'Compact Version', component: CompactExample },
    { id: 'custom', label: 'Custom Styling', component: CustomStylingExample },
    { id: 'a11y', label: 'Accessibility Testing', component: AccessibilityExample },
  ];

  const ActiveComponent = examples.find(ex => ex.id === activeExample)?.component || BasicExample;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto py-4">
            {examples.map((example) => (
              <button
                key={example.id}
                onClick={() => setActiveExample(example.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeExample === example.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <ActiveComponent />
    </div>
  );
};

export default UserProfileCardDemo;