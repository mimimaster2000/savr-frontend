import React from 'react';
import {
  useProfilePage,
  CANADIAN_PROVINCES,
  COMMON_DIETARY_RESTRICTIONS,
  type ProfileTabType,
} from '@/hooks/useProfilePage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Settings, UtensilsCrossed, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS: { id: ProfileTabType; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'User', icon: User },
  { id: 'account', label: 'Account', icon: Settings },
  { id: 'dietary', label: 'Dietary', icon: UtensilsCrossed },
  { id: 'preferences', label: 'Brands', icon: Heart },
];

const ProfilePageMobile: React.FC = () => {
  const profile = useProfilePage();

  if (profile.loading) {
    return (
      <div className="min-h-screen pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-slate-50 dark:bg-slate-900">
      {/* Header + Tabs - sticky together (z-30 so sidebar overlay z-50 covers it) */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900">
        <div className="px-4 py-3 bg-cyan-100 dark:bg-cyan-900 border-b border-slate-200/60 dark:border-slate-700/60">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Manage your account and preferences</p>
        </div>
        <div className="overflow-x-auto scrollbar-hide border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-1 px-4 py-2 min-w-max">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => profile.setActiveTab(id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  profile.activeTab === id
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      {profile.error && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {profile.error}
        </div>
      )}
      {profile.success && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm">
          {profile.success}
        </div>
      )}

      {/* Form content - scrollable */}
      <form
        id="profile-form-mobile"
        onSubmit={profile.handleProfileSubmit}
        className="flex-1 overflow-auto"
      >
        <div className="p-4 pb-24 space-y-6">
          {/* Profile Tab */}
          {profile.activeTab === 'profile' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">User Details</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="email-m" className="text-slate-700 dark:text-slate-300">
                    Email
                  </Label>
                  <Input
                    id="email-m"
                    type="email"
                    value={profile.email}
                    onChange={(e) => profile.setEmail(e.target.value)}
                    className="mt-1.5 h-12 text-base"
                    required
                  />
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-base font-medium mb-3 text-slate-900 dark:text-white">
                    Change Password
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="currentPassword-m">Current Password</Label>
                      <Input
                        id="currentPassword-m"
                        type="password"
                        value={profile.currentPassword}
                        onChange={(e) => profile.setCurrentPassword(e.target.value)}
                        className="mt-1.5 h-12"
                        placeholder="Current password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword-m">New Password</Label>
                      <Input
                        id="newPassword-m"
                        type="password"
                        value={profile.newPassword}
                        onChange={profile.handleNewPasswordChange}
                        className={cn(
                          'mt-1.5 h-12',
                          profile.passwordError && 'border-red-500',
                        )}
                        placeholder="New password"
                      />
                      {profile.passwordError && (
                        <p className="text-red-500 text-xs mt-1">{profile.passwordError}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword-m">Confirm Password</Label>
                      <Input
                        id="confirmPassword-m"
                        type="password"
                        value={profile.confirmPassword}
                        onChange={profile.handleConfirmPasswordChange}
                        className={cn(
                          'mt-1.5 h-12',
                          profile.confirmPasswordError && 'border-red-500',
                        )}
                        placeholder="Confirm new password"
                      />
                      {profile.confirmPasswordError && (
                        <p className="text-red-500 text-xs mt-1">
                          {profile.confirmPasswordError}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={profile.handlePasswordReset}
                      disabled={
                        !profile.currentPassword ||
                        !profile.newPassword ||
                        !profile.confirmPassword ||
                        !!profile.passwordError ||
                        !!profile.confirmPasswordError
                      }
                      className="w-full h-12"
                    >
                      Update Password
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {profile.activeTab === 'account' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Account Information
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="firstName-m">First Name</Label>
                  <Input
                    id="firstName-m"
                    value={profile.firstName}
                    onChange={(e) => profile.setFirstName(e.target.value)}
                    className="mt-1.5 h-12 text-base"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName-m">Last Name</Label>
                  <Input
                    id="lastName-m"
                    value={profile.lastName}
                    onChange={(e) => profile.setLastName(e.target.value)}
                    className="mt-1.5 h-12 text-base"
                    required
                  />
                </div>
                <h4 className="text-base font-medium pt-2 text-slate-900 dark:text-white">
                  Address
                </h4>
                <div>
                  <Label htmlFor="street-m">Street Address</Label>
                  <Input
                    id="street-m"
                    value={profile.street}
                    onChange={(e) => profile.setStreet(e.target.value)}
                    className="mt-1.5 h-12 text-base"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city-m">City</Label>
                  <Input
                    id="city-m"
                    value={profile.city}
                    onChange={(e) => profile.setCity(e.target.value)}
                    className="mt-1.5 h-12 text-base"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="province-m">Province</Label>
                  <select
                    id="province-m"
                    value={profile.province}
                    onChange={(e) => profile.setProvince(e.target.value)}
                    required
                    className="mt-1.5 flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                  >
                    <option value="">Select province</option>
                    {CANADIAN_PROVINCES.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="postalCode-m">Postal Code</Label>
                  <Input
                    id="postalCode-m"
                    value={profile.postalCode}
                    onChange={profile.handlePostalCodeChange}
                    className={cn(
                      'mt-1.5 h-12 text-base',
                      profile.postalCodeError && 'border-red-500',
                    )}
                    placeholder="A1A 1A1"
                    required
                  />
                  {profile.postalCodeError && (
                    <p className="text-red-500 text-xs mt-1">
                      {profile.postalCodeError}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phoneNumber-m">Phone Number</Label>
                  <Input
                    id="phoneNumber-m"
                    value={profile.phoneNumber}
                    onChange={profile.handlePhoneNumberChange}
                    className={cn(
                      'mt-1.5 h-12 text-base',
                      profile.phoneNumberError && 'border-red-500',
                    )}
                    placeholder="(123) 456-7890"
                    required
                  />
                  {profile.phoneNumberError && (
                    <p className="text-red-500 text-xs mt-1">
                      {profile.phoneNumberError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dietary Tab */}
          {profile.activeTab === 'dietary' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Dietary Restrictions
              </h3>
              <div>
                <h4 className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  Common restrictions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {COMMON_DIETARY_RESTRICTIONS.map((r) => {
                    const sel = profile.dietaryRestrictions.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => profile.toggleDietaryRestriction(r)}
                        className={cn(
                          'px-3 py-2 rounded-xl text-sm font-medium border transition-colors',
                          sel
                            ? 'bg-green-100 dark:bg-green-900/40 border-green-500 text-green-700 dark:text-green-300'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300',
                        )}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Tap to toggle. Selected:{' '}
                  {profile.dietaryRestrictions.length
                    ? profile.dietaryRestrictions.join(', ')
                    : 'None'}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  Custom restrictions
                </h4>
                {profile.dietaryRestrictions.filter(
                  (r) => !COMMON_DIETARY_RESTRICTIONS.includes(r),
                ).length === 0 ? (
                  <p className="text-sm text-slate-500">No custom restrictions.</p>
                ) : (
                  <ul className="space-y-2 mb-3">
                    {profile.dietaryRestrictions
                      .filter((r) => !COMMON_DIETARY_RESTRICTIONS.includes(r))
                      .map((r) => (
                        <li
                          key={r}
                          className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-xl"
                        >
                          <span className="text-slate-900 dark:text-white">{r}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => profile.removeDietaryRestriction(r)}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom restriction"
                    value={profile.newDietaryRestriction}
                    onChange={(e) => profile.setNewDietaryRestriction(e.target.value)}
                    className="h-12 flex-1"
                  />
                  <Button
                    type="button"
                    onClick={profile.addDietaryRestriction}
                    disabled={!profile.newDietaryRestriction.trim()}
                    className="h-12 px-4"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {profile.activeTab === 'preferences' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Brand Preferences
              </h3>
              <div>
                <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-3">
                  Brands you like
                </h4>
                {Object.keys(profile.likedBrands).length === 0 ? (
                  <p className="text-sm text-slate-500 mb-3">None added.</p>
                ) : (
                  <ul className="space-y-2 mb-4">
                    {Object.entries(profile.likedBrands).map(([cat, brand]) => (
                      <li
                        key={cat}
                        className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-l-4 border-green-500"
                      >
                        <span className="text-slate-900 dark:text-white">
                          <strong>{cat}:</strong> {brand}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => profile.removeBrand('liked', cat)}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="space-y-2 mb-4">
                  <Input
                    placeholder="Category (e.g. Pasta Sauce)"
                    value={profile.newLikedCategory}
                    onChange={(e) => profile.setNewLikedCategory(e.target.value)}
                    className="h-12"
                  />
                  <Input
                    placeholder="Brand name"
                    value={profile.newLikedBrand}
                    onChange={(e) => profile.setNewLikedBrand(e.target.value)}
                    className="h-12"
                  />
                  <Button
                    type="button"
                    onClick={() => profile.addBrand('liked')}
                    disabled={!profile.newLikedCategory || !profile.newLikedBrand}
                    className="w-full h-12"
                  >
                    Add preferred brand
                  </Button>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-3">
                  Brands you dislike
                </h4>
                {Object.keys(profile.dislikedBrands).length === 0 ? (
                  <p className="text-sm text-slate-500 mb-3">None added.</p>
                ) : (
                  <ul className="space-y-2 mb-4">
                    {Object.entries(profile.dislikedBrands).map(([cat, brand]) => (
                      <li
                        key={cat}
                        className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-l-4 border-red-500"
                      >
                        <span className="text-slate-900 dark:text-white">
                          <strong>{cat}:</strong> {brand}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => profile.removeBrand('disliked', cat)}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="space-y-2">
                  <Input
                    placeholder="Category (e.g. Cookies)"
                    value={profile.newDislikedCategory}
                    onChange={(e) => profile.setNewDislikedCategory(e.target.value)}
                    className="h-12"
                  />
                  <Input
                    placeholder="Brand name"
                    value={profile.newDislikedBrand}
                    onChange={(e) => profile.setNewDislikedBrand(e.target.value)}
                    className="h-12"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => profile.addBrand('disliked')}
                    disabled={!profile.newDislikedCategory || !profile.newDislikedBrand}
                    className="w-full h-12"
                  >
                    Add disliked brand
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Fixed bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button
            type="button"
            variant="outline"
            onClick={profile.handleCancel}
            disabled={profile.saving}
            className="flex-1 h-12"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="profile-form-mobile"
            disabled={profile.saving}
            className="flex-1 h-12"
          >
            {profile.saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePageMobile;

