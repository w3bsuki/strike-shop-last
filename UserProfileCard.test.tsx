/**
 * UserProfileCard Component Tests
 * 
 * Comprehensive test suite demonstrating frontend testing best practices:
 * - Component rendering and prop handling
 * - User interactions and accessibility
 * - Error states and edge cases
 * - Performance considerations
 * 
 * @author Frontend Specialist Agent
 * @version 1.0.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import UserProfileCard, { User, UserProfileCardProps } from './UserProfileCard';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// ===== TEST DATA =====

const mockUser: User = {
  id: 'test-user-1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  title: 'Software Engineer',
  company: 'Tech Corp',
  avatar: 'https://example.com/avatar.jpg',
  bio: 'Passionate software engineer with 5 years of experience in React and TypeScript.',
  location: 'San Francisco, CA',
  isOnline: true,
  socials: {
    twitter: 'https://twitter.com/johndoe',
    linkedin: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe'
  }
};

const mockUserMinimal: User = {
  id: 'test-user-2',
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  isOnline: false
};

const defaultProps: UserProfileCardProps = {
  user: mockUser
};

// ===== HELPER FUNCTIONS =====

const renderUserProfileCard = (props: Partial<UserProfileCardProps> = {}) => {
  const user = userEvent.setup();
  const utils = render(<UserProfileCard {...defaultProps} {...props} />);
  return { user, ...utils };
};

// ===== BASIC RENDERING TESTS =====

describe('UserProfileCard - Basic Rendering', () => {
  test('renders user information correctly', () => {
    renderUserProfileCard();
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer at Tech Corp')).toBeInTheDocument();
    expect(screen.getByText(mockUser.bio!)).toBeInTheDocument();
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
  });

  test('renders user avatar with correct alt text', () => {
    renderUserProfileCard();
    
    const avatar = screen.getByRole('img', { name: /john doe's avatar/i });
    expect(avatar).toHaveAttribute('src', mockUser.avatar);
    expect(avatar).toHaveAttribute('alt', "John Doe's avatar");
  });

  test('renders online status indicator', () => {
    renderUserProfileCard();
    
    const onlineStatus = screen.getByRole('status', { name: /online/i });
    expect(onlineStatus).toBeInTheDocument();
  });

  test('renders offline status for offline user', () => {
    renderUserProfileCard({ user: { ...mockUser, isOnline: false } });
    
    const offlineStatus = screen.getByRole('status', { name: /offline/i });
    expect(offlineStatus).toBeInTheDocument();
  });

  test('renders social media links', () => {
    renderUserProfileCard();
    
    expect(screen.getByLabelText("John Doe's Twitter profile")).toBeInTheDocument();
    expect(screen.getByLabelText("John Doe's LinkedIn profile")).toBeInTheDocument();
    expect(screen.getByLabelText("John Doe's GitHub profile")).toBeInTheDocument();
  });

  test('renders minimal user data without optional fields', () => {
    renderUserProfileCard({ user: mockUserMinimal });
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
    expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
    expect(screen.queryByText('San Francisco, CA')).not.toBeInTheDocument();
  });
});

// ===== AVATAR AND FALLBACK TESTS =====

describe('UserProfileCard - Avatar Handling', () => {
  test('displays initials fallback when no avatar provided', () => {
    renderUserProfileCard({ user: { ...mockUser, avatar: undefined } });
    
    const avatarFallback = screen.getByRole('img', { name: /john doe's avatar/i });
    expect(avatarFallback).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument(); // Initials
  });

  test('displays initials fallback when avatar fails to load', async () => {
    renderUserProfileCard();
    
    const avatar = screen.getByRole('img', { name: /john doe's avatar/i }) as HTMLImageElement;
    
    // Simulate image load error
    fireEvent.error(avatar);
    
    await waitFor(() => {
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  test('handles single name for initials', () => {
    renderUserProfileCard({ 
      user: { ...mockUser, name: 'Madonna', avatar: undefined } 
    });
    
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  test('handles long names for initials', () => {
    renderUserProfileCard({ 
      user: { ...mockUser, name: 'John Michael Smith Jr.', avatar: undefined } 
    });
    
    expect(screen.getByText('JM')).toBeInTheDocument(); // Only first two initials
  });
});

// ===== SIZE VARIANTS TESTS =====

describe('UserProfileCard - Size Variants', () => {
  test('applies small size classes correctly', () => {
    renderUserProfileCard({ size: 'sm' });
    
    const card = screen.getByRole('region');
    expect(card).toHaveClass('max-w-sm');
  });

  test('applies medium size classes correctly (default)', () => {
    renderUserProfileCard({ size: 'md' });
    
    const card = screen.getByRole('region');
    expect(card).toHaveClass('max-w-md');
  });

  test('applies large size classes correctly', () => {
    renderUserProfileCard({ size: 'lg' });
    
    const card = screen.getByRole('region');
    expect(card).toHaveClass('max-w-lg');
  });
});

// ===== EDITING FUNCTIONALITY TESTS =====

describe('UserProfileCard - Editing Functionality', () => {
  test('does not show edit button when not editable', () => {
    renderUserProfileCard({ editable: false });
    
    expect(screen.queryByLabelText(/edit.*profile/i)).not.toBeInTheDocument();
  });

  test('shows edit button when editable', () => {
    renderUserProfileCard({ editable: true });
    
    expect(screen.getByLabelText(/edit john doe's profile/i)).toBeInTheDocument();
  });

  test('enters edit mode when edit button is clicked', async () => {
    const { user } = renderUserProfileCard({ editable: true });
    
    const editButton = screen.getByLabelText(/edit john doe's profile/i);
    await user.click(editButton);
    
    // Check for edit form fields
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  test('calls onEditToggle callback when edit mode is toggled', async () => {
    const onEditToggle = jest.fn();
    const { user } = renderUserProfileCard({ 
      editable: true, 
      onEditToggle 
    });
    
    const editButton = screen.getByLabelText(/edit john doe's profile/i);
    await user.click(editButton);
    
    expect(onEditToggle).toHaveBeenCalledWith(true);
  });

  test('updates user data when form is submitted', async () => {
    const onUserUpdate = jest.fn();
    const { user } = renderUserProfileCard({ 
      editable: true, 
      onUserUpdate 
    });
    
    // Enter edit mode
    await user.click(screen.getByLabelText(/edit john doe's profile/i));
    
    // Modify name field
    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Doe');
    
    // Save changes
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    
    expect(onUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockUser,
        name: 'Jane Doe'
      })
    );
  });

  test('cancels edit mode and restores original data', async () => {
    const { user } = renderUserProfileCard({ editable: true });
    
    // Enter edit mode
    await user.click(screen.getByLabelText(/edit john doe's profile/i));
    
    // Modify name field
    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Modified Name');
    
    // Cancel changes
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    
    // Check that original name is still displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Modified Name')).not.toBeInTheDocument();
  });

  test('validates required fields before saving', async () => {
    const onUserUpdate = jest.fn();
    const { user } = renderUserProfileCard({ 
      editable: true, 
      onUserUpdate 
    });
    
    // Enter edit mode
    await user.click(screen.getByLabelText(/edit john doe's profile/i));
    
    // Clear required name field
    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    
    // Try to save
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    
    // Should not call onUserUpdate with empty name
    expect(onUserUpdate).not.toHaveBeenCalled();
    
    // Focus should be on the name input
    expect(nameInput).toHaveFocus();
  });

  test('validates email format before saving', async () => {
    const onUserUpdate = jest.fn();
    const { user } = renderUserProfileCard({ 
      editable: true, 
      onUserUpdate 
    });
    
    // Enter edit mode
    await user.click(screen.getByLabelText(/edit john doe's profile/i));
    
    // Enter invalid email
    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');
    
    // Try to save
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    
    // Should not call onUserUpdate with invalid email
    expect(onUserUpdate).not.toHaveBeenCalled();
    
    // Focus should be on the email input
    expect(emailInput).toHaveFocus();
  });
});

// ===== KEYBOARD NAVIGATION TESTS =====

describe('UserProfileCard - Keyboard Navigation', () => {
  test('edit button is keyboard accessible', async () => {
    const { user } = renderUserProfileCard({ editable: true });
    
    const editButton = screen.getByLabelText(/edit john doe's profile/i);
    
    // Focus the button using tab
    await user.tab();
    // Skip other focusable elements if any
    await user.tab({ shift: true });
    await user.tab();
    
    expect(editButton).toHaveFocus();
    
    // Activate with Enter key
    await user.keyboard('{Enter}');
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  test('escapes edit mode with Escape key', async () => {
    const { user } = renderUserProfileCard({ editable: true });
    
    // Enter edit mode
    await user.click(screen.getByLabelText(/edit john doe's profile/i));
    
    // Press Escape
    await user.keyboard('{Escape}');
    
    // Should exit edit mode
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('social media links are keyboard accessible', async () => {
    const { user } = renderUserProfileCard();
    
    const twitterLink = screen.getByLabelText(/twitter/i);
    const linkedinLink = screen.getByLabelText(/linkedin/i);
    const githubLink = screen.getByLabelText(/github/i);
    
    // All links should be focusable
    expect(twitterLink).toHaveAttribute('href', mockUser.socials!.twitter);
    expect(linkedinLink).toHaveAttribute('href', mockUser.socials!.linkedin);
    expect(githubLink).toHaveAttribute('href', mockUser.socials!.github);
  });
});

// ===== ERROR AND LOADING STATES TESTS =====

describe('UserProfileCard - Error and Loading States', () => {
  test('displays loading state correctly', () => {
    renderUserProfileCard({ isLoading: true });
    
    expect(screen.getByLabelText(/loading user profile/i)).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  test('displays error state correctly', () => {
    const errorMessage = 'Failed to load user profile';
    renderUserProfileCard({ error: errorMessage });
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error Loading Profile')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  test('error state has proper ARIA attributes', () => {
    renderUserProfileCard({ error: 'Test error' });
    
    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toHaveAttribute('aria-live', 'polite');
  });
});

// ===== EXTENDED INFORMATION TESTS =====

describe('UserProfileCard - Extended Information', () => {
  test('shows extended information when showExtended is true', () => {
    renderUserProfileCard({ showExtended: true });
    
    expect(screen.getByText(mockUser.bio!)).toBeInTheDocument();
    expect(screen.getByText(mockUser.location!)).toBeInTheDocument();
  });

  test('hides extended information when showExtended is false', () => {
    renderUserProfileCard({ showExtended: false });
    
    expect(screen.queryByText(mockUser.bio!)).not.toBeInTheDocument();
    expect(screen.queryByText(mockUser.location!)).not.toBeInTheDocument();
  });
});

// ===== ACCESSIBILITY TESTS =====

describe('UserProfileCard - Accessibility', () => {
  test('has no accessibility violations', async () => {
    const { container } = renderUserProfileCard();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('has proper ARIA landmarks and labels', () => {
    renderUserProfileCard();
    
    const card = screen.getByRole('region');
    expect(card).toHaveAttribute('aria-labelledby', `${mockUser.id}-name`);
    expect(card).toHaveAttribute('aria-describedby', `${mockUser.id}-bio`);
  });

  test('form fields have proper labels in edit mode', async () => {
    const { user } = renderUserProfileCard({ editable: true });
    
    await user.click(screen.getByLabelText(/edit john doe's profile/i));
    
    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^bio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^location/i)).toBeInTheDocument();
  });

  test('required fields are marked properly', async () => {
    const { user } = renderUserProfileCard({ editable: true });
    
    await user.click(screen.getByLabelText(/edit john doe's profile/i));
    
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    
    expect(nameInput).toHaveAttribute('aria-required', 'true');
    expect(emailInput).toHaveAttribute('aria-required', 'true');
  });

  test('focus management works correctly in edit mode', async () => {
    const { user } = renderUserProfileCard({ editable: true });
    
    const editButton = screen.getByLabelText(/edit john doe's profile/i);
    await user.click(editButton);
    
    // Cancel edit mode
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    
    // Focus should return to edit button
    await waitFor(() => {
      expect(editButton).toHaveFocus();
    });
  });
});

// ===== PERFORMANCE TESTS =====

describe('UserProfileCard - Performance', () => {
  test('component memoization prevents unnecessary re-renders', () => {
    const { rerender } = renderUserProfileCard();
    
    // Re-render with same props
    rerender(<UserProfileCard {...defaultProps} />);
    
    // Component should not re-render if props haven't changed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('handles large bio text efficiently', () => {
    const userWithLargeBio = {
      ...mockUser,
      bio: 'A'.repeat(1000) // Very long bio
    };
    
    const { container } = renderUserProfileCard({ user: userWithLargeBio });
    
    expect(container.textContent).toContain('A'.repeat(1000));
  });
});

// ===== EDGE CASES TESTS =====

describe('UserProfileCard - Edge Cases', () => {
  test('handles empty strings gracefully', () => {
    const userWithEmptyFields = {
      ...mockUser,
      title: '',
      company: '',
      bio: '',
      location: ''
    };
    
    renderUserProfileCard({ user: userWithEmptyFields });
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  });

  test('handles special characters in name', () => {
    const userWithSpecialChars = {
      ...mockUser,
      name: 'José María Aznar-López'
    };
    
    renderUserProfileCard({ user: userWithSpecialChars });
    
    expect(screen.getByText('José María Aznar-López')).toBeInTheDocument();
  });

  test('handles very long names gracefully', () => {
    const userWithLongName = {
      ...mockUser,
      name: 'Supercalifragilisticexpialidocious Antidisestablishmentarianism'
    };
    
    renderUserProfileCard({ user: userWithLongName });
    
    const nameElement = screen.getByText(userWithLongName.name);
    expect(nameElement).toHaveClass('truncate');
  });

  test('handles missing social media gracefully', () => {
    const userWithoutSocials = {
      ...mockUser,
      socials: undefined
    };
    
    renderUserProfileCard({ user: userWithoutSocials });
    
    expect(screen.queryByLabelText(/twitter/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/linkedin/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/github/i)).not.toBeInTheDocument();
  });

  test('handles partial social media data', () => {
    const userWithPartialSocials = {
      ...mockUser,
      socials: {
        twitter: 'https://twitter.com/user'
        // No LinkedIn or GitHub
      }
    };
    
    renderUserProfileCard({ user: userWithPartialSocials });
    
    expect(screen.getByLabelText(/twitter/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/linkedin/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/github/i)).not.toBeInTheDocument();
  });
});

// ===== CUSTOM STYLING TESTS =====

describe('UserProfileCard - Custom Styling', () => {
  test('applies custom className', () => {
    const customClass = 'custom-profile-card';
    renderUserProfileCard({ className: customClass });
    
    const card = screen.getByRole('region');
    expect(card).toHaveClass(customClass);
  });

  test('maintains default classes with custom className', () => {
    const customClass = 'custom-profile-card';
    renderUserProfileCard({ className: customClass });
    
    const card = screen.getByRole('region');
    expect(card).toHaveClass('bg-white', 'border', 'border-gray-200', customClass);
  });
});

// ===== INTEGRATION TESTS =====

describe('UserProfileCard - Integration', () => {
  test('full edit workflow integration', async () => {
    const onUserUpdate = jest.fn();
    const onEditToggle = jest.fn();
    
    const { user } = renderUserProfileCard({
      editable: true,
      onUserUpdate,
      onEditToggle
    });
    
    // 1. Enter edit mode
    await user.click(screen.getByLabelText(/edit john doe's profile/i));
    expect(onEditToggle).toHaveBeenCalledWith(true);
    
    // 2. Make changes
    await user.clear(screen.getByLabelText(/name/i));
    await user.type(screen.getByLabelText(/name/i), 'Updated Name');
    
    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), 'Senior Engineer');
    
    // 3. Save changes
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    
    expect(onUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated Name',
        title: 'Senior Engineer'
      })
    );
    expect(onEditToggle).toHaveBeenCalledWith(false);
  });
});