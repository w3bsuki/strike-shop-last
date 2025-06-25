/**
 * UserProfileCard Component
 * 
 * A production-ready, accessible user profile card component built with React and TypeScript.
 * Demonstrates modern frontend best practices including:
 * - Strict TypeScript typing
 * - WCAG 2.1 AA accessibility compliance
 * - Responsive design with Tailwind CSS
 * - Smooth animations and hover states
 * - Comprehensive error handling
 * - Performance optimizations
 * 
 * @author Frontend Specialist Agent
 * @version 1.0.0
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// ===== TYPE DEFINITIONS =====

/**
 * User data interface with strict typing
 */
interface User {
  /** Unique user identifier */
  id: string;
  /** User's full name */
  name: string;
  /** User's email address */
  email: string;
  /** User's job title or role */
  title?: string;
  /** User's company or organization */
  company?: string;
  /** User's profile avatar URL */
  avatar?: string;
  /** User's bio or description */
  bio?: string;
  /** User's location */
  location?: string;
  /** Whether user is currently online */
  isOnline: boolean;
  /** Social media links */
  socials?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

/**
 * Component props interface
 */
interface UserProfileCardProps {
  /** User data to display */
  user: User;
  /** Whether the card is in edit mode */
  editable?: boolean;
  /** Callback for when user data is updated */
  onUserUpdate?: (updatedUser: User) => void;
  /** Callback for when edit mode is toggled */
  onEditToggle?: (isEditing: boolean) => void;
  /** Optional CSS class name */
  className?: string;
  /** Optional loading state */
  isLoading?: boolean;
  /** Optional error state */
  error?: string;
  /** Card size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show extended information */
  showExtended?: boolean;
}

/**
 * Internal component state interface
 */
interface ComponentState {
  isEditing: boolean;
  imageError: boolean;
  focusedElement: string | null;
  editedUser: User;
}

// ===== CUSTOM HOOKS =====

/**
 * Custom hook for handling image loading errors
 */
const useImageFallback = (src?: string) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!src);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  // Reset error state when src changes
  useEffect(() => {
    if (src) {
      setHasError(false);
      setIsLoading(true);
    }
  }, [src]);

  return { hasError, isLoading, handleError, handleLoad };
};

/**
 * Custom hook for keyboard navigation
 */
const useKeyboardNavigation = (onEscape: () => void) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onEscape();
    }
  }, [onEscape]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// ===== UTILITY FUNCTIONS =====

/**
 * Generates initials from a name
 */
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Validates email format
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generates CSS classes for different sizes
 */
const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  const sizeMap = {
    sm: {
      card: 'max-w-sm',
      avatar: 'w-16 h-16',
      title: 'text-lg',
      subtitle: 'text-sm',
    },
    md: {
      card: 'max-w-md',
      avatar: 'w-20 h-20',
      title: 'text-xl',
      subtitle: 'text-base',
    },
    lg: {
      card: 'max-w-lg',
      avatar: 'w-24 h-24',
      title: 'text-2xl',
      subtitle: 'text-lg',
    },
  };
  return sizeMap[size];
};

// ===== MAIN COMPONENT =====

/**
 * UserProfileCard Component
 * 
 * A comprehensive user profile card with editing capabilities,
 * accessibility features, and responsive design.
 */
export const UserProfileCard: React.FC<UserProfileCardProps> = React.memo(({
  user,
  editable = false,
  onUserUpdate,
  onEditToggle,
  className = '',
  isLoading = false,
  error,
  size = 'md',
  showExtended = true,
}) => {
  // ===== STATE MANAGEMENT =====
  const [state, setState] = useState<ComponentState>({
    isEditing: false,
    imageError: false,
    focusedElement: null,
    editedUser: { ...user },
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);

  // ===== CUSTOM HOOKS =====
  const { hasError: imageHasError, isLoading: imageIsLoading, handleError: handleImageError, handleLoad: handleImageLoad } = useImageFallback(user.avatar);

  useKeyboardNavigation(() => {
    if (state.isEditing) {
      handleCancelEdit();
    }
  });

  // ===== COMPUTED VALUES =====
  const sizeClasses = useMemo(() => getSizeClasses(size), [size]);
  
  const cardClasses = useMemo(() => {
    return [
      'relative',
      'bg-white',
      'border',
      'border-gray-200',
      'rounded-xl',
      'shadow-lg',
      'overflow-hidden',
      'transition-all',
      'duration-300',
      'hover:shadow-xl',
      'hover:border-gray-300',
      'focus-within:ring-2',
      'focus-within:ring-blue-500',
      'focus-within:ring-offset-2',
      sizeClasses.card,
      className,
    ].join(' ');
  }, [sizeClasses.card, className]);

  // ===== EVENT HANDLERS =====

  /**
   * Handles toggling edit mode
   */
  const handleEditToggle = useCallback(() => {
    const newEditingState = !state.isEditing;
    setState(prev => ({ 
      ...prev, 
      isEditing: newEditingState,
      editedUser: newEditingState ? { ...user } : prev.editedUser
    }));
    onEditToggle?.(newEditingState);
  }, [state.isEditing, user, onEditToggle]);

  /**
   * Handles saving edited user data
   */
  const handleSaveEdit = useCallback(() => {
    // Validate required fields
    if (!state.editedUser.name.trim()) {
      // Focus on name field for accessibility
      const nameInput = cardRef.current?.querySelector('input[name="name"]') as HTMLInputElement;
      nameInput?.focus();
      return;
    }

    if (!isValidEmail(state.editedUser.email)) {
      // Focus on email field for accessibility
      const emailInput = cardRef.current?.querySelector('input[name="email"]') as HTMLInputElement;
      emailInput?.focus();
      return;
    }

    onUserUpdate?.(state.editedUser);
    setState(prev => ({ ...prev, isEditing: false }));
    onEditToggle?.(false);
    
    // Return focus to edit button
    setTimeout(() => editButtonRef.current?.focus(), 0);
  }, [state.editedUser, onUserUpdate, onEditToggle]);

  /**
   * Handles canceling edit mode
   */
  const handleCancelEdit = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isEditing: false,
      editedUser: { ...user }
    }));
    onEditToggle?.(false);
    
    // Return focus to edit button
    setTimeout(() => editButtonRef.current?.focus(), 0);
  }, [user, onEditToggle]);

  /**
   * Handles input changes during editing
   */
  const handleInputChange = useCallback((field: keyof User, value: string) => {
    setState(prev => ({
      ...prev,
      editedUser: { ...prev.editedUser, [field]: value }
    }));
  }, []);

  /**
   * Handles social media input changes
   */
  const handleSocialChange = useCallback((platform: keyof NonNullable<User['socials']>, value: string) => {
    setState(prev => ({
      ...prev,
      editedUser: {
        ...prev.editedUser,
        socials: {
          ...prev.editedUser.socials,
          [platform]: value
        }
      }
    }));
  }, []);

  // ===== RENDER HELPERS =====

  /**
   * Renders the user avatar with fallback
   */
  const renderAvatar = () => {
    const avatarClasses = [
      sizeClasses.avatar,
      'rounded-full',
      'object-cover',
      'border-4',
      'border-white',
      'shadow-lg',
      'transition-all',
      'duration-300',
    ].join(' ');

    if (imageHasError || !user.avatar) {
      return (
        <div 
          className={`${avatarClasses} bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold`}
          role="img"
          aria-label={`${user.name}'s avatar`}
        >
          <span className={size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'}>
            {getInitials(user.name)}
          </span>
        </div>
      );
    }

    return (
      <img
        src={user.avatar}
        alt={`${user.name}'s avatar`}
        className={avatarClasses}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    );
  };

  /**
   * Renders online status indicator
   */
  const renderOnlineStatus = () => (
    <div 
      className={`absolute ${size === 'sm' ? 'bottom-1 right-1' : 'bottom-2 right-2'} ${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} rounded-full border-2 border-white shadow-sm ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
      role="status"
      aria-label={user.isOnline ? 'Online' : 'Offline'}
    />
  );

  /**
   * Renders editable input field
   */
  const renderEditableField = (
    field: keyof User,
    label: string,
    value: string,
    type: 'text' | 'email' | 'textarea' = 'text',
    required = false
  ) => {
    const inputId = `${user.id}-${field}`;
    const inputClasses = [
      'w-full',
      'px-3',
      'py-2',
      'border',
      'border-gray-300',
      'rounded-md',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-blue-500',
      'focus:border-transparent',
      'transition-colors',
      'duration-200',
    ].join(' ');

    return (
      <div className="space-y-1">
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
        {type === 'textarea' ? (
          <textarea
            id={inputId}
            name={field}
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={`${inputClasses} resize-none`}
            rows={3}
            aria-required={required}
          />
        ) : (
          <input
            id={inputId}
            name={field}
            type={type}
            value={value}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={inputClasses}
            aria-required={required}
          />
        )}
      </div>
    );
  };

  /**
   * Renders social media links
   */
  const renderSocialLinks = () => {
    if (!user.socials && !state.isEditing) return null;

    const socials = state.isEditing ? state.editedUser.socials : user.socials;

    return (
      <div className="flex space-x-4">
        {state.isEditing ? (
          <div className="w-full space-y-2">
            <label className="block text-sm font-medium text-gray-700">Social Links</label>
            <div className="space-y-2">
              <input
                type="url"
                placeholder="Twitter URL"
                value={socials?.twitter || ''}
                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="url"
                placeholder="LinkedIn URL"
                value={socials?.linkedin || ''}
                onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="url"
                placeholder="GitHub URL"
                value={socials?.github || ''}
                onChange={(e) => handleSocialChange('github', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ) : (
          <>
            {socials?.twitter && (
              <a
                href={socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label={`${user.name}'s Twitter profile`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            )}
            {socials?.linkedin && (
              <a
                href={socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label={`${user.name}'s LinkedIn profile`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            )}
            {socials?.github && (
              <a
                href={socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label={`${user.name}'s GitHub profile`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            )}
          </>
        )}
      </div>
    );
  };

  // ===== ERROR HANDLING =====
  if (error) {
    return (
      <div className={cardClasses} role="alert" aria-live="polite">
        <div className="p-6 text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Error Loading Profile</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <div className={cardClasses} aria-live="polite" aria-label="Loading user profile">
        <div className="p-6 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className={`${sizeClasses.avatar} bg-gray-300 rounded-full`} />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4" />
              <div className="h-3 bg-gray-300 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <article 
      ref={cardRef}
      className={cardClasses}
      role="region"
      aria-labelledby={`${user.id}-name`}
      aria-describedby={`${user.id}-bio`}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-30" />
      
      {/* Header section */}
      <div className="relative p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {renderAvatar()}
              {renderOnlineStatus()}
            </div>
            
            <div className="flex-1 min-w-0">
              {state.isEditing ? (
                <div className="space-y-3">
                  {renderEditableField('name', 'Name', state.editedUser.name, 'text', true)}
                  {renderEditableField('email', 'Email', state.editedUser.email, 'email', true)}
                  {renderEditableField('title', 'Title', state.editedUser.title || '', 'text')}
                  {renderEditableField('company', 'Company', state.editedUser.company || '', 'text')}
                </div>
              ) : (
                <>
                  <h2 
                    id={`${user.id}-name`}
                    className={`${sizeClasses.title} font-bold text-gray-900 truncate`}
                  >
                    {user.name}
                  </h2>
                  <p className={`${sizeClasses.subtitle} text-gray-600 truncate`}>
                    {user.email}
                  </p>
                  {user.title && (
                    <p className="text-sm text-gray-500 truncate font-medium">
                      {user.title}
                      {user.company && ` at ${user.company}`}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Edit button */}
          {editable && (
            <button
              ref={editButtonRef}
              onClick={handleEditToggle}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={state.isEditing ? 'Cancel editing' : `Edit ${user.name}'s profile`}
            >
              {state.isEditing ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content section */}
      {showExtended && (
        <div className="px-6 pb-6">
          {state.isEditing ? (
            <div className="space-y-4">
              {renderEditableField('bio', 'Bio', state.editedUser.bio || '', 'textarea')}
              {renderEditableField('location', 'Location', state.editedUser.location || '', 'text')}
              {renderSocialLinks()}
              
              {/* Edit action buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <>
              {user.bio && (
                <div className="mb-4">
                  <p 
                    id={`${user.id}-bio`}
                    className="text-sm text-gray-700 leading-relaxed"
                  >
                    {user.bio}
                  </p>
                </div>
              )}
              
              {user.location && (
                <div className="mb-4 flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{user.location}</span>
                </div>
              )}
              
              {renderSocialLinks()}
            </>
          )}
        </div>
      )}
    </article>
  );
});

// Set display name for debugging
UserProfileCard.displayName = 'UserProfileCard';

// ===== EXPORT =====
export default UserProfileCard;

// ===== TYPE EXPORTS =====
export type { User, UserProfileCardProps };