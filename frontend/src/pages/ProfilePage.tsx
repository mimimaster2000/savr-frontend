import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

// Canadian provinces for the dropdown
const CANADIAN_PROVINCES = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" }
];

// Common dietary restrictions
const COMMON_DIETARY_RESTRICTIONS = [
  "Gluten Free",
  "Dairy Free",
  "Nut Allergy",
  "Peanut Allergy",
  "Shellfish Allergy",
  "Vegetarian",
  "Vegan",
  "Kosher",
  "Halal",
  "Keto",
  "Paleo",
  "Diabetic",
  "Low Sodium",
  "Low FODMAP",
  "Weight Watchers",
  "Celiac Disease",
  "Pescatarian",
  "Soy Allergy",
  "Egg Allergy",
  "Low Carb"
];

// Validation functions
const validatePostalCode = (postalCode: string): boolean => {
  // Canadian postal code format: A1A 1A1
  const regex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
  return regex.test(postalCode);
};

const validatePhoneNumber = (phoneNumber: string): boolean => {
  // North American phone number format
  const regex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return regex.test(phoneNumber);
};

type TabType = 'profile' | 'account' | 'preferences' | 'dietary';

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Form state
  const [email, setEmail] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [province, setProvince] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  // Validation states
  const [postalCodeError, setPostalCodeError] = useState<string | null>(null);
  const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null);
  
  // New sections
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [newDietaryRestriction, setNewDietaryRestriction] = useState<string>('');
  const [likedBrands, setLikedBrands] = useState<{[key: string]: string}>({});
  const [dislikedBrands, setDislikedBrands] = useState<{[key: string]: string}>({});
  const [newLikedCategory, setNewLikedCategory] = useState<string>('');
  const [newLikedBrand, setNewLikedBrand] = useState<string>('');
  const [newDislikedCategory, setNewDislikedCategory] = useState<string>('');
  const [newDislikedBrand, setNewDislikedBrand] = useState<string>('');
  
  // Define fetchUserProfile function to be used in both useEffect and handleSubmit
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      console.log('Fetching user profile...');
      const user = await authService.getProfile();
      
      console.log('Received user profile:', JSON.stringify(user, null, 2));
      
      // Basic profile info
      setEmail(user.email || '');
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      
      // Address information
      if (user.address) {
        setStreet(user.address.street || '');
        setCity(user.address.city || '');
        setProvince(user.address.province || '');
        setPostalCode(user.address.postalCode || '');
        setPhoneNumber(user.address.phoneNumber || '');
        console.log('Loaded address data:', JSON.stringify(user.address, null, 2));
      } else {
        console.log('No address data found in profile');
      }
      
      // Handle dietary restrictions (try both camelCase and snake_case formats)
      const restrictions = user.dietaryRestrictions || user.dietary_restrictions || [];
      console.log('Loaded dietary restrictions from profile:', restrictions);
      
      // Ensure restrictions is always an array, even if it's not in the database
      if (Array.isArray(restrictions)) {
        setDietaryRestrictions(restrictions);
        console.log('Set dietary restrictions state to:', restrictions);
      } else {
        console.warn('Unexpected format for dietary restrictions:', restrictions);
        setDietaryRestrictions([]);
      }
      
      // Handle brand preferences (try both formats)
      if (user.brandPreferences || user.brand_preferences) {
        const prefs = user.brandPreferences || user.brand_preferences;
        console.log('Loaded brand preferences from profile:', JSON.stringify(prefs, null, 2));
        
        if (prefs && typeof prefs === 'object') {
          if (prefs.liked && prefs.disliked) {
            // New format with liked/disliked structure
            setLikedBrands(
              typeof prefs.liked === 'object' && prefs.liked !== null
                ? (prefs.liked as { [key: string]: string })
                : {}
            );
            
            setDislikedBrands(
              typeof prefs.disliked === 'object' && prefs.disliked !== null
                ? (prefs.disliked as { [key: string]: string })
                : {}
            );
            
            console.log('Set liked brands to:', JSON.stringify(prefs.liked, null, 2));
            console.log('Set disliked brands to:', JSON.stringify(prefs.disliked, null, 2));
          } else if (!('liked' in prefs) && !('disliked' in prefs)) {
            // Old format (flat object of categories to brands)
            setLikedBrands(prefs as { [key: string]: string });
            setDislikedBrands({});
            console.log('Using old format, set liked brands to:', JSON.stringify(prefs, null, 2));
          } else {
            // Fallback to empty objects
            console.warn('Unexpected structure in brand preferences:', prefs);
            setLikedBrands({});
            setDislikedBrands({});
          }
        } else {
          console.warn('Brand preferences is not an object:', prefs);
          setLikedBrands({});
          setDislikedBrands({});
        }
      } else {
        // No preferences at all
        console.log('No brand preferences found in profile');
        setLikedBrands({});
        setDislikedBrands({});
      }
      
      setLoading(false);
      console.log('Profile loading complete');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load your profile information');
      setLoading(false);
    }
  };
  
  // Load user data
  useEffect(() => {
    fetchUserProfile();
  }, []);
  
  // Renamed this function to avoid conflict with react-hook-form
  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Basic form validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }
    if (!street.trim()) {
      setError('Street address is required');
      return;
    }
    if (!city.trim()) {
      setError('City is required');
      return;
    }
    if (!province.trim()) {
      setError('Province is required');
      return;
    }
    if (!postalCode.trim()) {
      setError('Postal code is required');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }
    
    // Validate postal code and phone number format
    if (!validatePostalCode(postalCode)) {
      setError('Please enter a valid Canadian postal code (format: A1A 1A1)');
      return;
    }
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const formattedPostalCode = postalCode.trim().toUpperCase();
      const formattedPhoneNumber = phoneNumber.trim();

      // Get current state from React state, not from potentially stale 'data' argument if manual validation is kept
      const currentDietaryRestrictions = [...dietaryRestrictions]; 
      const currentLikedBrands = {...likedBrands};
      const currentDislikedBrands = {...dislikedBrands};
      
      const profileData = {
        email,
        first_name: firstName,
        last_name: lastName,
        bio: '', // Assuming bio is not provided in the form
        address: {
          street,
          city,
          province,
          postalCode: formattedPostalCode,
          phoneNumber: formattedPhoneNumber
        },
        dietaryRestrictions: currentDietaryRestrictions,
        brandPreferences: {
          liked: currentLikedBrands,
          disliked: currentDislikedBrands
        }
      };
      
      console.log('Sending profile update:', JSON.stringify(profileData, null, 2));
      
      const updatedUser = await authService.updateProfile(profileData);
      
      console.log('Profile update successful:', JSON.stringify(updatedUser, null, 2));
      setSuccess('Your profile has been updated successfully');
      
      // Update state based on the validated data sent
      setEmail(updatedUser.email || '');
      setFirstName(updatedUser.first_name || '');
      setLastName(updatedUser.last_name || '');
      setStreet(updatedUser.address?.street || '');
      setCity(updatedUser.address?.city || '');
      setProvince(updatedUser.address?.province || '');
      setPostalCode(formattedPostalCode);
      setPhoneNumber(formattedPhoneNumber);
      // Keep local state for restrictions/prefs as they were sent
      setDietaryRestrictions(currentDietaryRestrictions);
      setLikedBrands(currentLikedBrands);
      setDislikedBrands(currentDislikedBrands);

      // Update localStorage
      try {
        localStorage.setItem('user', JSON.stringify({
          ...updatedUser, // Use response for ID, etc.
          ...profileData, // Ensure sent data overrides response where needed
          address: profileData.address, // Ensure address is updated
          dietaryRestrictions: currentDietaryRestrictions, // Ensure these are persisted
          brandPreferences: profileData.brandPreferences // Ensure these are persisted
        }));
        console.log('Updated localStorage with latest profile');
      } catch (err) {
        console.error('Error updating localStorage:', err);
      }
      
      setSaving(false);
    } catch (error: any) {
        console.error('Error updating profile:', error);
        let errorMessage = 'Failed to update your profile';
        if (error.response) {
            const detail = error.response.data?.detail;
            if (typeof detail === 'string') {
              errorMessage = detail;
            } else if (Array.isArray(detail)) {
              errorMessage = detail.map((err: any) => 
                err.loc && err.msg ? `Error at ${err.loc.join('.')}: ${err.msg}` : JSON.stringify(err)
              ).join('\n');
            } else if (typeof detail === 'object' && detail !== null) {
              errorMessage = Object.entries(detail).map(([key, value]) => `${key}: ${value}`).join('\n');
            } else if (detail) {
              errorMessage = String(detail);
            } else if (typeof error.response.data === 'string') {
                errorMessage = error.response.data;
            }
        } else if (error.message) {
          errorMessage = error.message;
        }
        setError(`Update failed: ${errorMessage}`);
        setSaving(false);
    }
  };

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPostalCode(value);
    if (value && !validatePostalCode(value)) {
      setPostalCodeError('Please enter a valid Canadian postal code (format: A1A 1A1)');
    } else {
      setPostalCodeError(null);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    if (value && !validatePhoneNumber(value)) {
      setPhoneNumberError('Please enter a valid phone number');
    } else {
      setPhoneNumberError(null);
    }
  };

  const addDietaryRestriction = () => {
    if (newDietaryRestriction && !dietaryRestrictions.includes(newDietaryRestriction)) {
      // Check that it's not already in the common restrictions list with different capitalization
      const normalizedNewRestriction = newDietaryRestriction.toLowerCase().trim();
      const alreadyExists = COMMON_DIETARY_RESTRICTIONS.some(
        restriction => restriction.toLowerCase() === normalizedNewRestriction
      );
      
      if (!alreadyExists) {
        setDietaryRestrictions([...dietaryRestrictions, newDietaryRestriction]);
        setNewDietaryRestriction('');
      } else {
        // Optionally show an error or just select the existing checkbox
        setError(`"${newDietaryRestriction}" is already in the common restrictions list.`);
        setTimeout(() => setError(null), 3000); // Clear error after 3 seconds
        setNewDietaryRestriction('');
      }
    }
  };

  const removeDietaryRestriction = (restriction: string) => {
    setDietaryRestrictions(dietaryRestrictions.filter(r => r !== restriction));
  };

  const addBrand = (type: 'liked' | 'disliked') => {
    if (type === 'liked' && newLikedCategory && newLikedBrand) {
      setLikedBrands({
        ...likedBrands,
        [newLikedCategory]: newLikedBrand
      });
      setNewLikedCategory('');
      setNewLikedBrand('');
    } else if (type === 'disliked' && newDislikedCategory && newDislikedBrand) {
      setDislikedBrands({
        ...dislikedBrands,
        [newDislikedCategory]: newDislikedBrand
      });
      setNewDislikedCategory('');
      setNewDislikedBrand('');
    }
  };

  const removeBrand = (type: 'liked' | 'disliked', category: string) => {
    if (type === 'liked') {
      const updatedPreferences = { ...likedBrands };
      delete updatedPreferences[category];
      setLikedBrands(updatedPreferences);
    } else {
      const updatedPreferences = { ...dislikedBrands };
      delete updatedPreferences[category];
      setDislikedBrands(updatedPreferences);
    }
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    
    // Password validation logic
    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
    } else if (!/[A-Z]/.test(value)) {
      setPasswordError('Password must contain at least one uppercase letter');
    } else if (!/[a-z]/.test(value)) {
      setPasswordError('Password must contain at least one lowercase letter');
    } else if (!/[0-9]/.test(value)) {
      setPasswordError('Password must contain at least one number');
    } else if (!/[^A-Za-z0-9]/.test(value)) {
      setPasswordError('Password must contain at least one special character');
    } else {
      setPasswordError(null);
    }
    
    // Update confirm password error if confirm password exists
    if (confirmPassword) {
      if (confirmPassword !== value) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError(null);
      }
    }
  };
  
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    if (value !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError(null);
    }
  };
  
  const handlePasswordReset = async () => {
    if (currentPassword && newPassword && confirmPassword && !passwordError && !confirmPasswordError) {
      try {
        setSaving(true);
        setError(null);
        setSuccess(null);
        
        // Call the API to update the password
        await authService.updatePassword(currentPassword, newPassword);
        
        // Reset form and show success message
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('Your password has been updated successfully');
        setSaving(false);
      } catch (error: any) {
        console.error('Error updating password:', error);
        setError(error.message || 'Failed to update your password');
        setSaving(false);
      }
    }
  };
  
  if (loading) {
    return <div className="flex justify-center p-8">Loading profile information...</div>;
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 m-4 rounded">
            {success}
          </div>
        )}

        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Details
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'account' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Account
            </button>
            <button
              onClick={() => setActiveTab('dietary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dietary' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dietary Restrictions
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'preferences' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Brand Preferences
            </button>
          </nav>
        </div>
        
        <form onSubmit={handleProfileSubmit} className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h3 className="text-lg font-medium mb-4">User Details</h3>
              <p className="text-sm text-gray-500 mb-6">Manage your email and password.</p>
              
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h4 className="text-md font-medium mb-4">Password Settings</h4>
                
                <div className="mb-4">
                  <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    className={`w-full p-2 border rounded ${passwordError ? 'border-red-500' : 'border-gray-300'}`}
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    placeholder="Enter a new password"
                  />
                  {passwordError && (
                    <p className="text-red-500 text-xs mt-1">{passwordError}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className={`w-full p-2 border rounded ${confirmPasswordError ? 'border-red-500' : 'border-gray-300'}`}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder="Confirm your new password"
                  />
                  {confirmPasswordError && (
                    <p className="text-red-500 text-xs mt-1">{confirmPasswordError}</p>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mt-2"
                  disabled={!currentPassword || !newPassword || !confirmPassword || passwordError !== null || confirmPasswordError !== null}
                >
                  Update Password
                </button>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Account Information</h3>
              <p className="text-sm text-gray-500 mb-6">Update your personal information and address details.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            
              <div className="mt-6 mb-4">
                <h4 className="text-md font-medium mb-3">Address Information</h4>
                
                <div className="mb-4">
                  <label htmlFor="street" className="block text-sm font-medium mb-1">
                    Street Address
                  </label>
                  <input
                    id="street"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium mb-1">
                      City
                    </label>
                    <input
                      id="city"
                      className="w-full p-2 border border-gray-300 rounded"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="province" className="block text-sm font-medium mb-1">
                      Province
                    </label>
                    <select
                      id="province"
                      className="w-full p-2 border border-gray-300 rounded"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select a province</option>
                      {CANADIAN_PROVINCES.map(prov => (
                        <option key={prov.code} value={prov.code}>{prov.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium mb-1">
                      Postal Code
                    </label>
                    <input
                      id="postalCode"
                      className={`w-full p-2 border rounded ${postalCodeError ? 'border-red-500' : 'border-gray-300'}`}
                      value={postalCode}
                      onChange={handlePostalCodeChange}
                      placeholder="A1A 1A1"
                      required
                    />
                    {postalCodeError && (
                      <p className="text-red-500 text-xs mt-1">{postalCodeError}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">
                      Phone Number
                    </label>
                    <input
                      id="phoneNumber"
                      className={`w-full p-2 border rounded ${phoneNumberError ? 'border-red-500' : 'border-gray-300'}`}
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      placeholder="(123) 456-7890"
                      required
                    />
                    {phoneNumberError && (
                      <p className="text-red-500 text-xs mt-1">{phoneNumberError}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Dietary Restrictions Tab */}
          {activeTab === 'dietary' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Dietary Restrictions</h3>
              <p className="text-sm text-gray-500 mb-6">Select any dietary restrictions or preferences you have.</p>
              
              {/* Common Dietary Restrictions Section */}
              <div className="mb-6">
                <h4 className="text-md font-medium mb-3">Common Dietary Restrictions</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {COMMON_DIETARY_RESTRICTIONS.map((restriction) => {
                    const isSelected = dietaryRestrictions.includes(restriction);
                    return (
                      <div key={restriction} className={`flex items-center space-x-2 ${isSelected ? 'bg-green-50 p-1 rounded' : ''}`}>
                        <input
                          type="checkbox"
                          id={`restriction-${restriction}`}
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              console.log(`Adding restriction: ${restriction}`);
                              setDietaryRestrictions([...dietaryRestrictions, restriction]);
                            } else {
                              console.log(`Removing restriction: ${restriction}`);
                              setDietaryRestrictions(dietaryRestrictions.filter(r => r !== restriction));
                            }
                          }}
                          className="h-4 w-4 border-gray-300 rounded accent-green-600"
                        />
                        <label 
                          htmlFor={`restriction-${restriction}`} 
                          className={`text-sm ${isSelected ? 'font-semibold text-green-700' : 'text-gray-700'}`}
                        >
                          {restriction}
                        </label>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Selected restrictions: {dietaryRestrictions.length ? dietaryRestrictions.join(', ') : 'None'}
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6 mb-6">
                <h4 className="text-md font-medium mb-3">Custom Dietary Restrictions</h4>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Your Custom Restrictions
                  </label>
                  
                  {dietaryRestrictions.filter(r => !COMMON_DIETARY_RESTRICTIONS.includes(r)).length === 0 ? (
                    <p className="text-sm text-gray-500">No custom dietary restrictions added.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {dietaryRestrictions
                        .filter(r => !COMMON_DIETARY_RESTRICTIONS.includes(r))
                        .map((restriction, index) => (
                          <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span>{restriction}</span>
                            <button 
                              type="button" 
                              onClick={() => removeDietaryRestriction(restriction)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add a custom dietary restriction"
                    className="flex-1 p-2 border border-gray-300 rounded"
                    value={newDietaryRestriction}
                    onChange={(e) => setNewDietaryRestriction(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={addDietaryRestriction}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    disabled={!newDietaryRestriction}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Brand Preferences Tab */}
          {activeTab === 'preferences' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Brand Preferences</h3>
              <p className="text-sm text-gray-500 mb-6">Add your favorite and least favorite brands for different categories.</p>
              
              {/* Brands You Like Section */}
              <div className="mb-8">
                <h4 className="text-md font-medium mb-3 text-green-700">Brands You Like</h4>
                
                <div className="mb-4">
                  {Object.keys(likedBrands).length === 0 ? (
                    <p className="text-sm text-gray-500">No preferred brands added yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {Object.entries(likedBrands).map(([category, brand], index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border-l-4 border-green-500">
                          <span>
                            <strong>{category}:</strong> {brand}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => removeBrand('liked', category)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <input
                    type="text"
                    placeholder="Category (e.g., Pasta Sauce)"
                    className="p-2 border border-gray-300 rounded"
                    value={newLikedCategory}
                    onChange={(e) => setNewLikedCategory(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Brand Name"
                    className="p-2 border border-gray-300 rounded"
                    value={newLikedBrand}
                    onChange={(e) => setNewLikedBrand(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addBrand('liked')}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mb-4"
                  disabled={!newLikedCategory || !newLikedBrand}
                >
                  Add Preferred Brand
                </button>
              </div>
              
              {/* Brands You Dislike Section */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium mb-3 text-red-700">Brands You Dislike</h4>
                
                <div className="mb-4">
                  {Object.keys(dislikedBrands).length === 0 ? (
                    <p className="text-sm text-gray-500">No disliked brands added yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {Object.entries(dislikedBrands).map(([category, brand], index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border-l-4 border-red-500">
                          <span>
                            <strong>{category}:</strong> {brand}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => removeBrand('disliked', category)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <input
                    type="text"
                    placeholder="Category (e.g., Cookies)"
                    className="p-2 border border-gray-300 rounded"
                    value={newDislikedCategory}
                    onChange={(e) => setNewDislikedCategory(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Brand Name"
                    className="p-2 border border-gray-300 rounded"
                    value={newDislikedBrand}
                    onChange={(e) => setNewDislikedBrand(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addBrand('disliked')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  disabled={!newDislikedCategory || !newDislikedBrand}
                >
                  Add Disliked Brand
                </button>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancel
            </button>
            
            <button 
              type="submit" 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage; 