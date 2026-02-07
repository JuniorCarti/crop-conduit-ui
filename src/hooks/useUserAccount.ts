import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ensureUserProfileDoc, getUserProfileDoc, type UserProfileDoc } from "@/services/userProfileService";

export function useUserAccount() {
  const { currentUser } = useAuth();
  return useQuery<UserProfileDoc | null>({
    queryKey: ["userAccount", currentUser?.uid],
    queryFn: async () => {
      if (!currentUser?.uid) return null;
      const profile = await getUserProfileDoc(currentUser.uid);
      if (profile) {
        if (import.meta.env.DEV) {
          console.debug("[RoleDebug] loaded role from Firestore:", profile.role);
        }
        return profile;
      }
      if (import.meta.env.DEV) {
        console.debug("[RoleDebug] user doc missing; creating fallback");
      }
      await ensureUserProfileDoc(currentUser.uid, {
        role: "farmer",
        orgId: null,
        orgRole: null,
        displayName: currentUser.displayName ?? undefined,
        email: currentUser.email ?? undefined,
        premium: false,
      });
      return getUserProfileDoc(currentUser.uid);
    },
    enabled: !!currentUser?.uid,
    staleTime: 1000 * 60 * 5,
  });
}
