import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@/services/authService';

export type ProfileTabType = 'profile' | 'account' | 'dietary' | 'preferences';

export const CANADIAN_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
];

export const COMMON_DIETARY_RESTRICTIONS = [
  'Gluten Free',
  'Dairy Free',
  'Nut Allergy',
  'Peanut Allergy',
  'Shellfish Allergy',
  'Vegetarian',
  'Vegan',
  'Kosher',
  'Halal',
  'Keto',
  'Paleo',
  'Diabetic',
  'Low Sodium',
  'Low FODMAP',
  'Weight Watchers',
  'Celiac Disease',
  'Pescatarian',
  'Soy Allergy',
  'Egg Allergy',
  'Low Carb',
];

const validatePostalCode = (postalCode: string): boolean => {
  const regex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
  return regex.test(postalCode);
};

const validatePhoneNumber = (phoneNumber: string): boolean => {
  const regex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return regex.test(phoneNumber);
};

export function useProfilePage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ProfileTabType>('profile');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
  const [postalCodeError, setPostalCodeError] = useState<string | null>(null);
  const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null);

  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [newDietaryRestriction, setNewDietaryRestriction] = useState<string>('');
  const [likedBrands, setLikedBrands] = useState<{ [key: string]: string }>({});
  const [dislikedBrands, setDislikedBrands] = useState<{ [key: string]: string }>({});
  const [newLikedCategory, setNewLikedCategory] = useState<string>('');
  const [newLikedBrand, setNewLikedBrand] = useState<string>('');
  const [newDislikedCategory, setNewDislikedCategory] = useState<string>('');
  const [newDislikedBrand, setNewDislikedBrand] = useState<string>('');

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const user = await authService.getProfile();

      setEmail(user.email || '');
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');

      if (user.address) {
        setStreet(user.address.street || '');
        setCity(user.address.city || '');
        setProvince(user.address.province || '');
        setPostalCode(user.address.postalCode || '');
        setPhoneNumber(user.address.phoneNumber || '');
      }

      const restrictions = user.dietaryRestrictions || user.dietary_restrictions || [];
      if (Array.isArray(restrictions)) {
        setDietaryRestrictions(restrictions);
      } else {
        setDietaryRestrictions([]);
      }

      if (user.brandPreferences || user.brand_preferences) {
        const prefs = user.brandPreferences || user.brand_preferences;
        if (prefs && typeof prefs === 'object') {
          if (prefs.liked && prefs.disliked) {
            setLikedBrands(
              typeof prefs.liked === 'object' && prefs.liked !== null
                ? (prefs.liked as { [key: string]: string })
                : {},
            );
            setDislikedBrands(
              typeof prefs.disliked === 'object' && prefs.disliked !== null
                ? (prefs.disliked as { [key: string]: string })
                : {},
            );
          } else if (!('liked' in prefs) && !('disliked' in prefs)) {
            setLikedBrands(prefs as { [key: string]: string });
            setDislikedBrands({});
          } else {
            setLikedBrands({});
            setDislikedBrands({});
          }
        } else {
          setLikedBrands({});
          setDislikedBrands({});
        }
      } else {
        setLikedBrands({});
        setDislikedBrands({});
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching user profile (mobile):', err);
      setError('Failed to load your profile information');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);

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
        await authService.updatePassword(currentPassword, newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('Your password has been updated successfully');
      } catch (err: any) {
        console.error('Error updating password (mobile):', err);
        setError(err.message || 'Failed to update your password');
      } finally {
        setSaving(false);
      }
    }
  };

  const addDietaryRestriction = () => {
    if (newDietaryRestriction && !dietaryRestrictions.includes(newDietaryRestriction)) {
      const normalizedNewRestriction = newDietaryRestriction.toLowerCase().trim();
      const alreadyExists = COMMON_DIETARY_RESTRICTIONS.some(
        (restriction) => restriction.toLowerCase() === normalizedNewRestriction,
      );

      if (!alreadyExists) {
        setDietaryRestrictions([...dietaryRestrictions, newDietaryRestriction]);
        setNewDietaryRestriction('');
      } else {
        setError(`"${newDietaryRestriction}" is already in the common restrictions list.`);
        setTimeout(() => setError(null), 3000);
        setNewDietaryRestriction('');
      }
    }
  };

  const toggleDietaryRestriction = (restriction: string) => {
    if (dietaryRestrictions.includes(restriction)) {
      setDietaryRestrictions(dietaryRestrictions.filter((r) => r !== restriction));
    } else {
      setDietaryRestrictions([...dietaryRestrictions, restriction]);
    }
  };

  const removeDietaryRestriction = (restriction: string) => {
    setDietaryRestrictions(dietaryRestrictions.filter((r) => r !== restriction));
  };

  const addBrand = (type: 'liked' | 'disliked') => {
    if (type === 'liked' && newLikedCategory && newLikedBrand) {
      setLikedBrands({
        ...likedBrands,
        [newLikedCategory]: newLikedBrand,
      });
      setNewLikedCategory('');
      setNewLikedBrand('');
    } else if (type === 'disliked' && newDislikedCategory && newDislikedBrand) {
      setDislikedBrands({
        ...dislikedBrands,
        [newDislikedCategory]: newDislikedBrand,
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

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

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

      const currentDietaryRestrictions = [...dietaryRestrictions];
      const currentLikedBrands = { ...likedBrands };
      const currentDislikedBrands = { ...dislikedBrands };

      const profileData = {
        email,
        first_name: firstName,
        last_name: lastName,
        bio: '',
        address: {
          street,
          city,
          province,
          postalCode: formattedPostalCode,
          phoneNumber: formattedPhoneNumber,
        },
        dietaryRestrictions: currentDietaryRestrictions,
        brandPreferences: {
          liked: currentLikedBrands,
          disliked: currentDislikedBrands,
        },
      };

      const updatedUser = await authService.updateProfile(profileData);

      setEmail(updatedUser.email || '');
      setFirstName(updatedUser.first_name || '');
      setLastName(updatedUser.last_name || '');
      setStreet(updatedUser.address?.street || '');
      setCity(updatedUser.address?.city || '');
      setProvince(updatedUser.address?.province || '');
      setPostalCode(formattedPostalCode);
      setPhoneNumber(formattedPhoneNumber);
      setDietaryRestrictions(currentDietaryRestrictions);
      setLikedBrands(currentLikedBrands);
      setDislikedBrands(currentDislikedBrands);

      try {
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...updatedUser,
            ...profileData,
            address: profileData.address,
            dietaryRestrictions: currentDietaryRestrictions,
            brandPreferences: profileData.brandPreferences,
          }),
        );
      } catch (err) {
        console.error('Error updating localStorage (mobile):', err);
      }

      setSuccess('Your profile has been updated successfully');
    } catch (err: any) {
      console.error('Error updating profile (mobile):', err);
      let errorMessage = 'Failed to update your profile';
      if (err.response) {
        const detail = err.response.data?.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail
            .map((e: any) =>
              e.loc && e.msg ? `Error at ${e.loc.join('.')}: ${e.msg}` : JSON.stringify(e),
            )
            .join('\n');
        } else if (typeof detail === 'object' && detail !== null) {
          errorMessage = Object.entries(detail)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        } else if (detail) {
          errorMessage = String(detail);
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(`Update failed: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return {
    // state
    activeTab,
    loading,
    saving,
    error,
    success,
    email,
    firstName,
    lastName,
    street,
    city,
    province,
    postalCode,
    phoneNumber,
    currentPassword,
    newPassword,
    confirmPassword,
    passwordError,
    confirmPasswordError,
    postalCodeError,
    phoneNumberError,
    dietaryRestrictions,
    newDietaryRestriction,
    likedBrands,
    dislikedBrands,
    newLikedCategory,
    newLikedBrand,
    newDislikedCategory,
    newDislikedBrand,
    // setters
    setActiveTab,
    setEmail,
    setFirstName,
    setLastName,
    setStreet,
    setCity,
    setProvince,
    setPostalCode,
    setPhoneNumber,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    setNewDietaryRestriction,
    setNewLikedCategory,
    setNewLikedBrand,
    setNewDislikedCategory,
    setNewDislikedBrand,
    // handlers
    handleProfileSubmit,
    handleCancel,
    handlePostalCodeChange,
    handlePhoneNumberChange,
    handleNewPasswordChange,
    handleConfirmPasswordChange,
    handlePasswordReset,
    addDietaryRestriction,
    toggleDietaryRestriction,
    removeDietaryRestriction,
    addBrand,
    removeBrand,
  };
}

