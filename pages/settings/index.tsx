import { useEffect, useState } from "react";
import { useSidebar } from "../../components/AppLayout";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/router";
import { GetStaticPropsContext } from "next";
import { saveImage } from "../api/storeImage";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useTranslations } from 'next-intl';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
  };
}

interface UserData {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
  email_verified: boolean;
  avatar_url: string | null;
  timezone: string;
  locale: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormData {
  name: string;
  timezone: string;
  locale: string;
}

interface Message {
  type: 'success' | 'error';
  text: string;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

const languageOptions: LanguageOption[] = [
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
];

const timezoneOptions = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney"
];

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    timezone: "UTC",
    locale: "en"
  });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const t = useTranslations('settings');

  const queryWorkspaceId = router.query.workspaceId as string | undefined;

  useEffect(() => {
    if (queryWorkspaceId && queryWorkspaceId !== activeWorkspaceId) {
      setActiveWorkspaceId(queryWorkspaceId);
    }
  }, [queryWorkspaceId, activeWorkspaceId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth/login");
          return;
        }

        setUser(user);

        // Fetch user data from the new public.users table
        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user data:", error);
          // If user doesn't exist in public.users, create a record
          if (error.code === 'PGRST116') {
            const { data: newUser } = await supabase
              .from("users")
              .insert([
                {
                  id: user.id,
                  email: user.email,
                  name: user.user_metadata?.name || null,
                  avatar_url: null,
                  timezone: 'UTC',
                  locale: 'en'
                }
              ])
              .select()
              .single();

            if (newUser) {
              setUserData(newUser);
              setFormData({
                name: newUser.name || "",
                timezone: newUser.timezone || "UTC",
                locale: newUser.locale || "en"
              });
              setProfileImage(newUser.avatar_url || null);
            }
          }
        } else if (userData) {
          setUserData(userData);
          setFormData({
            name: userData.name || "",
            timezone: userData.timezone || "UTC",
            locale: userData.locale || "en"
          });
          setProfileImage(userData.avatar_url || null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const saveUserData = async (field: keyof FormData) => {
    if (!user) return;

    const { error } = await supabase
      .from("users")
      .update({
        [field]: formData[field],
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (!error) {
      setEditField(null);
      setUserData({ ...userData!, [field]: formData[field] });
    } else {
      console.error("Error updating user data:", error);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: t('newPasswordsMismatch') });
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: passwordData.newPassword
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: t('passwordChangedSuccess') });
      setShowChangePasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !activeWorkspaceId) return;

    setUploading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileData = {
        name: file.name || `uploaded-${Date.now()}.jpg`,
        buffer,
        type: file.type || "image/jpeg",
      };

      const result = await saveImage({
        userId: user.id,
        workspaceId: activeWorkspaceId,
        file: fileData,
      });

      if (!result.success) {
        throw new Error(result.error || "Image upload failed");
      }

      setProfileImage(result.image.url);

      // Update avatar_url in the database
      await supabase
        .from("users")
        .update({
          avatar_url: result.image.url,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    const name = userData?.name || "";

    if (name) {
      return name[0].toUpperCase();
    } else if (user?.email) {
      return user.email[0].toUpperCase();
    }

    return "U";
  };

  const displayName = userData?.name || user?.user_metadata?.name || user?.email || "User";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex bg-white text-black bg-cover bg-center">
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{t('changePassword')}</h2>

            {message && (
              <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.text}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{t('currentPassword')}</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{t('newPassword')}</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">{t('conNewPass')}</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handlePasswordChange}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {t('updatePassword')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative flex w-full flex-1 flex-col overflow-auto md:rounded-lg">
        <div className="bg-[#F6F9FF]">
          <div className="relative flex min-h-16 w-full items-center justify-between bg-transparent px-4 py-3 md:hidden">
            <button
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:select-none text-primary underline-offset-4 hover:underline h-10 w-10 md:h-12 md:w-12 flex-none cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="size-6 stroke-2 stroke-black"
              >
                <path
                  d="M3 12H21M3 6H21M3 18H21"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center px-4 py-10">
            <div className="flex w-full max-w-xl flex-col gap-12">
              <div className="flex flex-col items-center gap-6">
                <div className="group relative flex cursor-pointer" style={{ borderRadius: "100px 100px 32px" }}>
                  <label
                    htmlFor="profile-upload"
                    className="relative h-24 w-24 overflow-hidden rounded-full group-hover:opacity-80 bg-blue-200 flex items-center justify-center cursor-pointer"
                  >
                    {profileImage ? (
                      <img
                        alt="Profile"
                        className="h-full w-full object-cover"
                        src={profileImage}
                      />
                    ) : (
                      <span className="text-2xl font-bold text-blue-800">
                        {getInitials()}
                      </span>
                    )}
                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  <div className="pointer-events-none absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/50 shadow-sm backdrop-blur-[100px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="none"
                      className="size-5"
                    >
                      <path
                        d="M5.5 8.5C5.5 6.84315 6.84315 5.5 8.5 5.5C10.1569 5.5 11.5 6.84315 11.5 8.5C11.5 10.1569 10.1569 11.5 8.5 11.5C6.84315 11.5 5.5 10.1569 5.5 8.5Z"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      ></path>
                      <path
                        d="M12.5 2H7.7587C6.95374 1.99999 6.28937 1.99998 5.74818 2.04419C5.18608 2.09012 4.66937 2.18868 4.18404 2.43598C3.43139 2.81947 2.81947 3.43139 2.43598 4.18404C2.18868 4.66937 2.09012 5.18608 2.04419 5.74818C1.99998 6.28937 1.99999 6.95372 2 7.75869V16.2413C1.99999 17.0463 1.99998 17.7106 2.04419 18.2518C2.09012 18.8139 2.18868 19.3306 2.43598 19.816C2.81947 20.5686 3.43139 21.1805 4.18404 21.564C4.66937 21.8113 5.18608 21.9099 5.74818 21.9558C5.92356 21.9701 6.11188 21.9798 6.31374 21.9864C6.52305 22.0003 6.77340 22.0002 7.03144 22.0002C10.3543 22.0002 13.6771 22 17 22C17.0465 22 17.0924 22 17.1376 22C17.933 22.0005 18.5236 22.0008 19.0353 21.8637C20.4156 21.4938 21.4938 20.4156 21.8637 19.0353C22.039 18.381 22.0002 17.6804 22 17.0095C22.0018 16.8202 22.0001 16.6308 22.0001 16.4415C22.0006 15.9726 22.0011 15.5594 21.8923 15.1647C21.7969 14.8182 21.6399 14.4917 21.429 14.2007C21.1887 13.8692 20.8658 13.6114 20.4993 13.3189L17.6683 11.0541C17.4984 10.9182 17.3304 10.7838 17.1779 10.6797C17.0083 10.5639 16.7995 10.4436 16.5382 10.3766C16.1709 10.2824 15.7843 10.2946 15.4237 10.4118C15.1671 10.4951 14.9663 10.6283 14.8043 10.7545C14.6586 10.8681 14.4995 11.0128 14.3385 11.1592L5.83046 18.8938C5.61698 19.0878 5.41061 19.2754 5.2589 19.4395C5.19807 19.5054 5.10567 19.6077 5.01929 19.743C4.67627 19.5501 4.39723 19.2598 4.21799 18.908C4.1383 18.7516 4.07337 18.5274 4.03755 18.089C4.00078 17.6389 4 17.0566 4 16.2V7.8C4 6.94342 4.00078 6.36113 4.03755 5.91104C4.07337 5.47262 4.1383 5.24842 4.21799 5.09202C4.40973 4.7157 4.7157 4.40973 5.09202 4.21799C5.24842 4.1383 5.47262 4.07337 5.91104 4.03755C6.36113 4.00078 6.94342 4 7.8 4H12.5C13.0523 4 13.5 3.55229 13.5 3C13.5 2.44772 13.0523 2 12.5 2Z"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      ></path>
                      <path
                        d="M20 2C20 1.44772 19.5523 1 19 1C18.4477 1 18 1.44772 18 2V4H16C15.4477 4 15 4.44772 15 5C15 5.55228 15.4477 6 16 6H18V8C18 8.55228 18.4477 9 19 9C19.5523 9 20 8.55228 20 8V6H22C22.5523 6 23 5.55228 23 5C23 4.44772 22.5523 4 22 4H20V2Z"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <p className="text-[24px] leading-[32px] font-medium tracking-[-0.045rem]">
                    {displayName}
                  </p>
                  <p className="text-[14px] leading-[20px] text-black/50">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-[16px] leading-[24px] font-medium text-black">
                  {t('personalDetails')}
                </p>
                <div className="flex flex-col gap-4">
                  {/* Name Field */}
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col rounded-2xl px-4 py-3 bg-black/5 cursor-pointer hover:bg-black/10 active:bg-black/15">
                      <p className="text-[14px] leading-[20px] text-black/50 capitalize">
                        {t('name')}
                      </p>
                      {editField === 'name' ? (
                        <input
                          className="border-none bg-transparent outline-none text-black"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          onBlur={() => saveUserData('name')}
                          onKeyDown={(e) => e.key === 'Enter' && saveUserData('name')}
                          autoFocus
                          style={{ fontSize: 16 }}
                        />
                      ) : (
                        <div
                          className="text-black cursor-pointer"
                          onClick={() => setEditField('name')}
                          style={{ fontSize: 16 }}
                        >
                          {formData.name || <span className="text-black/50">Add name</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email Field (read-only) */}
                  <div className="opacity-50">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col rounded-2xl px-4 py-3 bg-black/5">
                        <p className="text-[14px] leading-[20px] text-black/50">
                          {t('email')}
                        </p>
                        <input
                          className="border-none bg-transparent outline-none text-black cursor-default"
                          type="text"
                          value={user?.email || ''}
                          readOnly
                          style={{ fontSize: 16 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rest of the component remains the same */}
              <div className="flex flex-col gap-3">
                <p className="text-[16px] leading-[24px] font-medium text-black">
                  {t('security')}
                </p>
                <div className="flex flex-col gap-4">
                  <div className="peer flex flex-col gap-1 rounded-2xl p-1 bg-white empty:hidden shadow-none">
                    <div className="group flex w-full items-center gap-3 rounded-xl p-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="none"
                        className="size-6 text-blue-500"
                      >
                        <path
                          d="M6 8C6 4.68629 8.68629 2 12 2C15.3137 2 18 4.68629 18 8V9.15032C18.2826 9.21225 18.5539 9.30243 18.816 9.43598C19.5686 9.81947 20.1805 10.4314 20.564 11.184C20.8113 11.6694 20.9099 12.1861 20.9558 12.7482C21 13.2894 21 13.9537 21 14.7587V16.2413C21 17.0463 21 17.7106 20.9558 18.2518C20.9099 18.8139 20.8113 19.3306 20.564 19.816C20.1805 20.5686 19.5686 21.1805 18.816 21.564C18.3306 21.8113 17.8139 21.9099 17.2518 21.9558C16.7106 22 16.0463 22 15.2413 22H8.75873C7.95375 22 7.28938 22 6.74818 21.9558C6.18608 21.9099 5.66938 21.8113 5.18404 21.564C4.43139 21.1805 3.81947 20.5686 3.43598 19.816C3.18868 19.3306 3.09012 18.8139 3.0442 18.2518C2.99998 17.7106 2.99999 17.0463 3 16.2413V14.7587C2.99999 13.9537 2.99998 13.2894 3.0442 12.7482C3.09012 12.1861 3.18868 11.6694 3.43598 11.184C3.81947 10.4314 4.43139 9.81947 5.18404 9.43598C5.44614 9.30243 5.71739 9.21226 6 9.15032V8ZM16 8V9.00163H8V8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8ZM13 14.5C13 13.9477 12.5523 13.5 12 13.5C11.4477 13.5 11 13.9477 11 14.5V16.5C11 17.0523 11.4477 17.5 12 17.5C12.5523 17.5 13 17.0523 13 16.5V14.5Z"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="text-[16px] leading-[24px] truncate font-medium">
                          {t('password')}
                        </p>
                      </div>
                      <button
                        className="relative inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium outline-none transition-all focus-visible:outline-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 active:scale-95 h-11 min-w-11 px-[12px] bg-black/5 hover:bg-black/10 active:bg-black/20 disabled:bg-black/5 before:pointer-events-none before:absolute before:inset-[-2px] before:rounded-full focus-visible:before:ring-2 focus-visible:before:ring-blue-500"
                        type="button"
                        onClick={() => setShowChangePasswordModal(true)}
                      >
                        <span className="mx-1.5 font-medium text-black stroke-black">
                          {t('changePassword')}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ... rest of the billing and other sections remain unchanged ... */}

              <div className="peer flex flex-col gap-1 rounded-2xl p-1 bg-white empty:hidden shadow-none">
                <div
                  onClick={() => logout()}
                  className="group flex w-full items-center gap-3 rounded-xl p-3 cursor-pointer hover:bg-black/5 active:bg-blue-500/5"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="size-6 stroke-2 stroke-red-500"
                  >
                    <path
                      d="M16 17L21 12M21 12L16 7M21 12H9M12 17C12 17.93 12 18.395 11.8978 18.7765C11.6204 19.8117 10.8117 20.6204 9.77646 20.8978C9.39496 21 8.92997 21 8 21H7.5C6.10218 21 5.40326 21 4.85195 20.7716C4.11687 20.4672 3.53284 19.8831 3.22836 19.1481C3 18.5967 3 17.8978 3 16.5V7.5C3 6.10217 3 5.40326 3.22836 4.85195C3.53284 4.11687 4.11687 3.53284 4.85195 3.22836C5.40326 3 6.10218 3 7.5 3H8C8.92997 3 9.39496 3 9.77646 3.10222C10.8117 3.37962 11.6204 4.18827 11.8978 5.22354C12 5.60504 12 6.07003 12 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-[16px] leading-[24px] truncate font-medium">
                      {t('signOut')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps({ locale }: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`../../messages/${locale}.json`)).default,
    },
  };
}